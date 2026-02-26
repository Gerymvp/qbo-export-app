import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // 1. Manejo de Preflight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, realmId } = await req.json();

    // OBTENCIÓN SEGURA DE CREDENCIALES
    // Debes configurar estos secretos en Supabase usando:
    // supabase secrets set QBO_CLIENT_ID=tu_id QBO_CLIENT_SECRET=tu_secreto
    const clientId = Deno.env.get('QBO_CLIENT_ID');
    const clientSecret = Deno.env.get('QBO_CLIENT_SECRET');
    
    // IMPORTANTE: Sin barra final para coincidir con el portal de Intuit
    const redirectUri = 'https://qbo-export-app.vercel.app'; 

    if (!clientId || !clientSecret) {
      throw new Error("Las credenciales de QuickBooks (QBO_CLIENT_ID/SECRET) no están configuradas en Supabase.");
    }

    // 2. Intercambio de código por Token
    const authHeader = btoa(`${clientId}:${clientSecret}`);
    
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Error detallado de QBO:", tokenData);
      throw new Error(tokenData.error_description || tokenData.error || 'Fallo en intercambio de tokens');
    }

    // 3. Inicializar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validar usuario
    const authHeaderRaw = req.headers.get('Authorization');
    if (!authHeaderRaw) throw new Error("Falta header de autorización");
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeaderRaw.replace('Bearer ', ''));
    if (userError || !user) throw new Error("Sesión de usuario inválida");

    // 4. Guardar tokens
    const { error: dbError } = await supabase
      .from('qbo_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        realm_id: realmId,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ message: "Conectado" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error en Edge Function:", errorMessage);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})