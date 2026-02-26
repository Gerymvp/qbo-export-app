import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { code, realmId } = await req.json()
    const clientId = Deno.env.get('INTUIT_CLIENT_ID')
    const clientSecret = Deno.env.get('INTUIT_CLIENT_SECRET')
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) throw new Error("No se proporcionó token de autorización");

    // 1. Validar Usuario con Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    // Extraer el token del Bearer
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Error Auth Supabase:", authError);
      throw new Error("Sesión de Supabase inválida");
    }

    // 2. Intercambio de Tokens con QBO
    // ASEGÚRATE QUE ESTA URL SEA IDÉNTICA A LA DEL DASHBOARD DE INTUIT
    const redirectUri = 'https://qbo-export-app.vercel.app'; 
    
    const basicAuth = btoa(`${clientId}:${clientSecret}`);
    
    console.log("Intercambiando código para el usuario:", user.id);

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
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
      throw new Error(tokenData.error_description || "Error en el intercambio de QuickBooks");
    }

    // 3. Guardar en Base de Datos usando Service Role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: upsertError } = await supabaseAdmin.from('qbo_tokens').upsert({
      user_id: user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      realm_id: realmId,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString()
    });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error fatal en la función:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Cambiado a 400 para evitar confusiones de auth si es error de QBO
    });
  }
})