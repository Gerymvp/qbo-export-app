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

  console.log("--- INICIO DE EJECUCIÓN ---");

  try {
    // 2. Extraer Body con validación
    const body = await req.json().catch(() => null);
    if (!body || !body.code || !body.realmId) {
      console.error("Cuerpo de petición inválido:", body);
      throw new Error("Faltan parámetros: code o realmId");
    }

    const { code, realmId } = body;
    const clientId = Deno.env.get('INTUIT_CLIENT_ID');
    const clientSecret = Deno.env.get('INTUIT_CLIENT_SECRET');
    const authHeader = req.headers.get('Authorization');

    console.log("Recibido RealmId:", realmId);

    if (!authHeader) {
      console.error("Falta Header Authorization");
      throw new Error("No se proporcionó token de autorización");
    }

    // 3. Validar Usuario con Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Error validando usuario Supabase:", authError);
      throw new Error("Sesión de Supabase inválida o expirada");
    }

    console.log("Usuario validado correctamente:", user.id);

    // 4. Intercambio de Tokens con QBO
    // NOTA: Esta URL debe ser EXACTAMENTE la registrada en Intuit Developer Portal
    const redirectUri = 'https://qbo-export-app.vercel.app'; 
    const basicAuth = btoa(`${clientId}:${clientSecret}`);
    
    console.log("Solicitando intercambio a Intuit...");

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
      console.error("Respuesta de Error de Intuit:", tokenData);
      throw new Error(tokenData.error_description || "Error en el intercambio de QuickBooks");
    }

    console.log("Tokens recibidos con éxito de Intuit");

    // 5. Guardar en Base de Datos usando Service Role (Admin)
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

    if (upsertError) {
      console.error("Error al guardar en DB:", upsertError);
      throw upsertError;
    }

    console.log("--- FINALIZADO CON ÉXITO ---");

    return new Response(JSON.stringify({ success: true, message: "Conectado correctamente" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error fatal detectado:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})