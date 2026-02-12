import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Validar al usuario
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) throw new Error('No autorizado')

    // 2. Obtener el token de QuickBooks
    const { data: tokenData, error: dbError } = await supabase
      .from('qbo_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .single()

    if (dbError || !tokenData) throw new Error('QuickBooks no está conectado')

    const { realmId } = await req.json()

    // 3. Consultar PROVEEDORES a QuickBooks
    // Query: Seleccionamos proveedores activos
    const query = "SELECT DisplayName, Id FROM Vendor WHERE Active = true MAXRESULTS 500"
    const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) throw new Error('Error al consultar QuickBooks API')

    const qboData = await response.json()
    const vendors = qboData.QueryResponse.Vendor || []

    return new Response(JSON.stringify({ vendors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})