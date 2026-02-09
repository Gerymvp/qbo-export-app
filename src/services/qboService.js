const QBO_BASE_URL = 'https://sandbox-quickbooks.api.intuit.com/v3/company'; 
// Cambiar a 'https://quickbooks.api.intuit.com' cuando pases a producción

export const sendBillToQBO = async (realmId, accessToken, billData) => {
  try {
    const response = await fetch(`${QBO_BASE_URL}/${realmId}/bill`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(billData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.Fault.Error[0].Message || 'Error al enviar a QBO');
    }

    return await response.json();
  } catch (error) {
    console.error("Error en QBO Service:", error);
    throw error;
  }
};