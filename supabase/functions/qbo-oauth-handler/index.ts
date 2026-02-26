import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 1. Manejo de Preflight (CORS) - Vital para navegadores modernos
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, realmId } = await req.json();

    // CREDENCIALES
    const clientId = 'ABK9ko4wbz4pMUSYqrcqqlHIKKeqXXlJ6AODNyy9Khl6X9td6V';
    const clientSecret = 'nAIFl0ICdoKrOPECt9sW6uXATxsjplOzuFq30r8O'; 
    
    // IMPORTANTE: Esta URI debe ser IDÉNTICA a la que envías desde el frontend.
    // Si en el frontend usas window.location.origin (sin /), aquí debe ser igual.
    const redirectUri = 'https://qbo-export-app.vercel.app'; 

    // 2. Intercambiar código por Token con QuickBooks
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

    // LOG DE DEPURACIÓN: Esto aparecerá en tus logs de Supabase si falla
    if (!tokenResponse.ok) {
      console.error("Error de QuickBooks:", tokenData);
      throw new Error(`QuickBooks Error: ${tokenData.error_description || tokenData.error || 'Unknown error'}`);
    }

    // 3. Inicializar Supabase con Service Role para saltar políticas RLS si es necesario
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener el usuario autenticado
    const authHeaderRaw = req.headers.get('Authorization');
    if (!authHeaderRaw) throw new Error("No se proporcionó token de autorización");
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeaderRaw.replace('Bearer ', ''));
    if (userError || !user) throw new Error("Usuario no autenticado o sesión expirada");

    // 4. Guardar o actualizar tokens (UPSERT)
    const { error: dbError } = await supabase
      .from('qbo_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        realm_id: realmId,
        // Calculamos la fecha de expiración real
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }); // Asegura que solo haya una conexión por usuario

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ message: "Conexión exitosa" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error en la función:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})