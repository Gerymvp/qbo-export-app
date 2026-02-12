import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Usamos SERVICE_ROLE para asegurar lectura de la tabla de tokens
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Validar al usuario mediante el token del header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) throw new Error('No autorizado');

    // 2. Obtener el token de acceso de la base de datos
    const { data: tokenData, error: dbError } = await supabaseClient
      .from('qbo_tokens')
      .select('access_token, realm_id')
      .eq('user_id', user.id)
      .single();

    if (dbError || !tokenData) throw new Error('QuickBooks no está conectado para este usuario');

    // 3. Consultar CUENTAS a QuickBooks (Asegúrate que la query diga Account)
    const query = "SELECT Name, Id, AccountType FROM Account WHERE Active = true MAXRESULTS 1000";
    const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${tokenData.realm_id}/query?query=${encodeURIComponent(query)}&minorversion=65`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error("Detalle error QBO:", errorDetail);
      throw new Error('Error al consultar cuentas en QBO');
    }

    const qboData = await response.json();
    // Extraemos Account (singular) de la respuesta de Intuit
    const accounts = qboData.QueryResponse.Account || [];

    // --- LOG SOLICITADO ---
    console.log("Cuentas encontradas en QBO:", JSON.stringify(accounts));

    // 4. Devolvemos el objeto con la llave "accounts"
    return new Response(JSON.stringify({ accounts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error en Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Error desconocido" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})