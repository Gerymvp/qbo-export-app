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
    const { code, realmId } = await req.json()

    // OBTENCIÓN DE CREDENCIALES
    const clientId = Deno.env.get('QBO_CLIENT_ID');
    const clientSecret = Deno.env.get('QBO_CLIENT_SECRET');
    
    /**
     * IMPORTANTE: Para desarrollo local con Vite, debe ser EXACTAMENTE:
     * http://localhost:5173/
     * Asegúrate de que esta URL también esté en el Intuit Developer Portal.
     */
    const redirectUri = 'http://localhost:5173/'; 

    if (!clientId || !clientSecret) {
      throw new Error("Faltan secretos QBO_CLIENT_ID o QBO_CLIENT_SECRET en Supabase");
    }

    // 2. VALIDACIÓN DEL USUARIO DE SUPABASE (Antes del intercambio de QBO)
    // Esto asegura que si el token de Supabase falló, no desperdiciamos el 'code' de QBO
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeaderRaw = req.headers.get('Authorization');
    if (!authHeaderRaw) throw new Error("No se proporcionó token de sesión (Authorization header missing)");
    
    const userToken = authHeaderRaw.replace(/[Bb]earer\s+/, "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(userToken);

    if (userError || !user) {
      console.error("Error Auth Supabase:", userError);
      throw new Error("La sesión de usuario expiró o es inválida. Re-inicia sesión en la app.");
    }

    // 3. Intercambio de código por Token con QuickBooks
    const basicAuth = btoa(`${clientId}:${clientSecret}`);
    
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
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
      console.error("Error de QuickBooks API:", tokenData);
      throw new Error(`QuickBooks rechazó el intercambio: ${tokenData.error_description || tokenData.error}`);
    }

    // 4. Guardar los tokens en la base de datos
    const { error: dbError } = await supabaseAdmin
      .from('qbo_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        realm_id: realmId,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error("Error DB Supabase:", dbError);
      throw new Error("Error al guardar tokens en la base de datos");
    }

    return new Response(JSON.stringify({ 
      message: "Conectado con éxito",
      realmId: realmId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error en Edge Function:", error.message);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})