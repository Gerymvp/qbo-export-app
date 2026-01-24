import React from 'react';
import { FileText, UploadCloud } from 'lucide-react';

const InvoiceExtractor = ({ onExtract }) => {
  const handleTextProcess = (e) => {
    const texto = e.target.value;
    if (texto.includes(',')) {
      const lineas = texto.split('\n').filter(l => l.trim() !== '');
      const data = lineas.map(linea => {
        const p = linea.split(',');
        return {
          id_temporal: Math.random(),
          nombre: p[0]?.trim() || 'Producto',
          sku: p[1]?.trim() || '',
          precio_venta: p[2]?.trim() || 0,
          costo_compra: p[3]?.trim() || 0,
          cantidad_existencia: p[4]?.trim() || 0,
          fecha_inventario: new Date().toISOString().split('T')[0]
        };
      });
      onExtract(data);
      e.target.value = '';
    }
  };

  return (
    <aside className="card">
      <h3 className="title"><FileText size={18} /> Extractor de Factura</h3>
      <textarea 
        placeholder="Pega líneas: Nombre, SKU, Precio, Costo, Cantidad" 
        onChange={handleTextProcess}
        className="invoice-textarea"
      />
      <div className="dropzone">
        <UploadCloud size={30} />
        <p>Arrastra PDF aquí</p>
      </div>
    </aside>
  );
};

export default InvoiceExtractor;