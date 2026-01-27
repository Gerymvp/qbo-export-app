import React from 'react';
import { FileText, UploadCloud, Clipboard } from 'lucide-react';
import '../styles/InvoiceExtractor.css';

const InvoiceExtractor = ({ onExtract }) => {
  const handleTextProcess = (e) => {
    const texto = e.target.value;
    // Procesa si detecta el formato Nombre, SKU, Precio...
    if (texto.includes(',')) {
      const lineas = texto.split('\n').filter(l => l.trim() !== '');
      const data = lineas.map(linea => {
        const p = linea.split(',');
        return {
          id_temporal: crypto.randomUUID(),
          nombre: p[0]?.trim() || 'Producto Nuevo',
          sku: p[1]?.trim() || '',
          precio_venta: parseFloat(p[2]) || 0,
          costo_compra: parseFloat(p[3]) || 0,
          cantidad_existencia: parseInt(p[4]) || 0,
          fecha_inventario: new Date().toISOString().split('T')[0],
          solo_local: false
        };
      });
      onExtract(data);
      e.target.value = '';
    }
  };

  return (
    <div className="invoice-card">
      <div className="invoice-header">
        <h3 className="title">
          <FileText size={18} /> 
          Extractor de Factura
        </h3>
      </div>
      
      <div className="invoice-body">
        <div className="input-field">
          <label><Clipboard size={14} /> Entrada de texto rápido</label>
          <textarea 
            placeholder="Formato: Nombre, SKU, Precio, Costo, Cantidad" 
            onChange={handleTextProcess}
            className="invoice-textarea"
          />
        </div>

        <div className="dropzone-container">
          <div className="dropzone">
            <UploadCloud size={32} className="icon-blue" />
            <p>Arrastra tu factura PDF aquí</p>
            <span>O haz clic para buscar archivo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceExtractor;