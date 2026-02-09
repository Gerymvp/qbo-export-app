import { XMLParser } from "fast-xml-parser";

export const parseInvoiceXML = (xmlData) => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });
  
  const jsonObj = parser.parse(xmlData);
  
  // Accedemos a la raíz del estándar panameño
  const factura = jsonObj?.rContFe?.xFe?.rFE;
  const general = factura?.gDGen;
  const emisor = general?.gEmis;
  const totales = factura?.gTot;
  const items = factura?.gItem;

  // Normalizamos los ítems para que siempre sea un array
  const listaItems = Array.isArray(items) ? items : [items];

  return {
    cufe: factura?.dId, // Clave Única de Factura Electrónica [cite: 64]
    proveedor: emisor?.dNombEm || "Desconocido", // CTRO DE LIT CRISTIANA S A 
    ruc: emisor?.gRucEmi?.dRuc + "-" + emisor?.gRucEmi?.dDV, // 8957-256-92193-38 
    fecha: general?.dFechaEm, // 2026-01-28 
    total: totales?.dVTot || 0, // B/. 20.70 
    itbms: totales?.dTotITBMS || 0, // B/. 0.62 
    items: listaItems.map(item => ({
      descripcion: item.dDescProd,
      cantidad: item.dCantCodInt,
      precioUnitario: item.gPrecios?.dPrUnit,
      totalItem: item.gPrecios?.dValTotItem
    }))
  };
};