import React, { useState } from 'react';
import { ClipboardPaste, Zap, Check, Terminal } from 'lucide-react';
import { CLC_SCRAPER_SCRIPT } from '../utils/scraperScript';
import '../styles/BulkScraper.css';

const BulkScraper = ({ politicas, onDataReady }) => {
  const [inputData, setInputData] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('');
  const [copiado, setCopiado] = useState(false);

  const copiarScript = () => {
    navigator.clipboard.writeText(CLC_SCRAPER_SCRIPT);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const procesarDatosPegados = () => {
    if (!inputData || !categoriaSel) {
      return alert("Selecciona la política de costos y pega los datos de la consola.");
    }

    try {
      const prodsExtraidos = JSON.parse(inputData);
      const politica = politicas.find(p => p.categoria === categoriaSel);
      let porcentajeCalculo = politica ? politica.descuento_porcentaje : 0;
      
      // Herencia: Si es Biblia y no tiene % propio, busca en Literatura
      if (categoriaSel.toLowerCase().includes('biblia') && !porcentajeCalculo) {
        const polLiteratura = politicas.find(p => p.categoria.toLowerCase() === 'literatura');
        if (polLiteratura) porcentajeCalculo = polLiteratura.descuento_porcentaje;
      }

      const prodsFinales = prodsExtraidos.map(p => {
        const precioVenta = parseFloat(p.precio_venta) || 0;
        const costoCalculado = (precioVenta * (1 - (porcentajeCalculo / 100))).toFixed(2);

        return {
          id_temporal: crypto.randomUUID(),
          nombre: p.nombre || 'Sin nombre',
          sku: p.sku || '',
          categoria: categoriaSel,
          precio_venta: precioVenta,
          costo_compra: parseFloat(costoCalculado),
          tipo_articulo: 'No está en el inventario', // Evita el error de celda vacía en QBO
          cantidad_existencia: 0,
          solo_local: true,
          fecha_inventario: new Date().toISOString().split('T')[0]
        };
      });

      onDataReady(prodsFinales);
      setInputData('');
      alert(`✅ ${prodsFinales.length} productos procesados con éxito.`);
    } catch (err) {
      alert("Error: El JSON pegado no es válido.");
    }
  };

  return (
    <div className="scraper-card">
      <div className="scraper-header">
        <div className="scraper-title">
          <Zap size={20} className="icon-orange" />
          <h3>Importador de Consola</h3>
        </div>
        <button onClick={copiarScript} className={`btn ${copiado ? 'btn-success' : 'btn-primary'}`}>
          {copiado ? <Check size={16} /> : <Terminal size={16} />}
          {copiado ? " ¡Copiado!" : " Copiar Script"}
        </button>
      </div>
      <div className="scraper-body">
        <textarea 
          className="textarea-standard" 
          placeholder="Pega aquí el JSON generado por la consola..."
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          rows={3}
        />
        <div className="scraper-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <select 
            className="input-standard" 
            value={categoriaSel} 
            onChange={(e) => setCategoriaSel(e.target.value)}
            style={{ flexGrow: 1 }}
          >
            <option value="">-- Seleccionar Categoría --</option>
            {politicas.map(p => (
              <option key={p.id} value={p.categoria}>{p.categoria}</option>
            ))}
          </select>
          <button className="btn btn-success" onClick={procesarDatosPegados}>
            <ClipboardPaste size={18} /> Procesar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkScraper;