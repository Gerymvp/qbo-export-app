import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // 1. Manejo de Preflight (CORS) obligatorio
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, realmId } = await req.json()

    // OBTENCIÓN DE CREDENCIALES DESDE VARIABLES DE ENTORNO
    const clientId = Deno.env.get('QBO_CLIENT_ID');
    const clientSecret = Deno.env.get('QBO_CLIENT_SECRET');
    
    // IMPORTANTE: Esta URL debe ser idéntica a la configurada en Intuit Developer Portal
    const redirectUri = 'https://qbo-export-app.vercel.app'; 

    if (!clientId || !clientSecret) {
      throw new Error("Faltan credenciales QBO_CLIENT_ID o QBO_CLIENT_SECRET en los Secretos de Supabase");
    }

    // 2. Intercambio de código por Token con QuickBooks (OAuth2)
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
      console.error("Error de QuickBooks API:", tokenData);
      // El error 401 suele venir de aquí si el clientSecret tiene espacios o el redirectUri no coincide
      throw new Error(`Error en QuickBooks: ${tokenData.error_description || tokenData.error}`);
    }

    // 3. Inicializar Supabase con SERVICE ROLE para saltar RLS al guardar el token
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    // 4. VALIDACIÓN ROBUSTA DEL USUARIO (Previene el 401 del lado de Supabase)
    const authHeaderRaw = req.headers.get('Authorization');
    if (!authHeaderRaw) throw new Error("No se proporcionó token de autorización");
    
    // Limpieza mejorada: extrae el token sin importar si 'Bearer' viene con mayúsculas o espacios extra
    const userToken = authHeaderRaw.split(" ").pop();
    
    if (!userToken) throw new Error("Formato de token inválido");

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(userToken);

    if (userError || !user) {
      console.error("Error validando usuario:", userError);
      throw new Error("Sesión de usuario inválida en Supabase");
    }

    // 5. Guardar o actualizar los tokens en la tabla 'qbo_tokens'
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

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ 
      message: "Conectado con éxito",
      realmId: realmId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error detectado en la función:", error.message);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Usamos 400 para errores de lógica/intercambio
    });
  }
})