import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // 1. Manejo de Preflight (CORS) obligatorio para Edge Functions
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, realmId } = await req.json();

    // OBTENCIÓN DE CREDENCIALES CON FALLBACK
    // Esto asegura que funcione aunque borres las duplicadas o cambies el nombre
    const clientId = Deno.env.get('QBO_CLIENT_ID') || Deno.env.get('INTUIT_CLIENT_ID');
    const clientSecret = Deno.env.get('QBO_CLIENT_SECRET') || Deno.env.get('INTUIT_CLIENT_SECRET');
    
    // El redirect URI debe ser idéntico al configurado en el Dashboard de Intuit
    const redirectUri = 'https://qbo-export-app.vercel.app'; 

    if (!clientId || !clientSecret) {
      throw new Error("Credenciales de QuickBooks no encontradas. Verifica los Secretos en Supabase.");
    }

    // 2. Intercambio de código por Token (OAuth2)
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
      console.error("Error de Intuit API:", tokenData);
      throw new Error(tokenData.error_description || tokenData.error || 'Fallo en intercambio de tokens');
    }

    // 3. Inicializar Supabase con SERVICE ROLE para gestión de base de datos
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // VALIDACIÓN DE USUARIO (Previene el error 401)
    const authHeaderRaw = req.headers.get('Authorization');
    if (!authHeaderRaw) throw new Error("Falta header de autorización en la petición");
    
    // Limpieza segura del token Bearer
    const token = authHeaderRaw.replace('Bearer ', '').trim();
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Error validando usuario:", userError);
      throw new Error("Sesión de usuario inválida o expirada");
    }

    // 4. Guardar o actualizar tokens en la base de datos
    const { error: dbError } = await supabaseAdmin
      .from('qbo_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        realm_id: realmId,
        // Calculamos la expiración exacta
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ 
      message: "Conexión con QuickBooks exitosa",
      realmId: realmId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error en Edge Function:", errorMessage);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Error controlado
    });
  }
})