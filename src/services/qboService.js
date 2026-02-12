import { supabase } from '../lib/supabase';

/**
 * Envía una factura (Bill) a QuickBooks a través de una Edge Function de Supabase
 * para evitar bloqueos de CORS y manejar la autenticación de forma segura.
 */
export const sendBillToQBO = async (realmId, accessToken, billData) => {
  try {
    // Invocamos la Edge Function 'create-qbo-bill'
    const { data, error } = await supabase.functions.invoke('create-qbo-bill', {
      body: { 
        realmId, 
        token: accessToken, 
        bill: billData 
      }
    });

    // Error de red o de la plataforma Supabase
    if (error) {
      console.error("Error al invocar la Edge Function:", error);
      throw new Error(`Error de conexión: ${error.message}`);
    }

    // Manejo de errores específicos devueltos por la API de QuickBooks
    if (data && data.Fault) {
      const msg = data.Fault.Error[0]?.Message || 'Error desconocido en QuickBooks';
      const detail = data.Fault.Error[0]?.Detail || '';
      throw new Error(`${msg}: ${detail}`);
    }

    // Si todo salió bien, devolvemos la respuesta de QBO
    return data;

  } catch (error) {
    console.error("Error en sendBillToQBO:", error);
    throw error;
  }
};