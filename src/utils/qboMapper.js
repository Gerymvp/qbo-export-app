/**
 * Convierte los datos del XML de Panamá al formato Bill de QuickBooks Online
 */
export const mapInvoiceToQBOBill = (invoiceData) => {
  return {
    "VendorRef": {
      "name": invoiceData.proveedor // QBO buscará al proveedor por nombre
    },
    "Line": invoiceData.items.map((item) => ({
      "Description": item.descripcion,
      "Amount": item.totalItem,
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": {
          "value": item.account || "1" // ID de la cuenta contable seleccionada en la tabla
        },
        "TaxCodeRef": {
          // Si el ítem tiene ITBMS, usamos el código TAX, si no, NON
          "value": (item.valITBMS > 0) ? "TAX" : "NON" 
        }
      }
    })),
    "DocNumber": invoiceData.cufe.substring(0, 21), // QBO tiene límite de caracteres en DocNumber
    "TxnDate": invoiceData.fecha,
    "PrivateNote": `CUFE: ${invoiceData.cufe}`,
    "CurrencyRef": {
      "value": "PAB" // Balboas (o USD según tu config en QBO)
    }
  };
};