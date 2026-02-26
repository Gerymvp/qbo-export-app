import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, realmId } = await req.json()

    // --- CAMBIO 1: USAR VARIABLES DE ENTORNO SIEMPRE ---
    const clientId = Deno.env.get('QBO_CLIENT_ID');
    const clientSecret = Deno.env.get('QBO_CLIENT_SECRET');
    
    // --- CAMBIO 2: LA URL DE PRODUCCIÓN ---
    const redirectUri = 'https://qbo-export-app.vercel.app'; 

    if (!clientId || !clientSecret) {
      throw new Error("Faltan credenciales en los Secretos de Supabase");
    }

    const authHeader = btoa(`${clientId}:${clientSecret}`);
    
    // Intercambio con QuickBooks
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri, // Debe ser idéntica a la de Intuit
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("Error de QuickBooks:", tokenData);
      throw new Error(`QuickBooks Error: ${tokenData.error_description || tokenData.error}`);
    }

    // 3. Guardar en Supabase usando SERVICE ROLE
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- CAMBIO 3: VALIDACIÓN ROBUSTA DEL USUARIO ---
    const authHeaderRaw = req.headers.get('Authorization');
    if (!authHeaderRaw) throw new Error("No se envió el token de usuario");
    
    const userToken = authHeaderRaw.replace('Bearer ', '').trim();
    const { data: { user }, error: userError } = await supabase.auth.getUser(userToken);

    if (userError || !user) throw new Error("Sesión de usuario inválida en Supabase");

    const { error: dbError } = await supabase
      .from('qbo_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        realm_id: realmId,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ message: "Conectado con éxito" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error detectado:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401, // Cambiamos a 401 para que el frontend sepa que es auth
    });
  }
})