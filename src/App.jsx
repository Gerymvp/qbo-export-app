import React, { useState, useEffect } from 'react'; // CORREGIDO: Asegúrate de que useEffect esté aquí
import { supabase } from './lib/supabase';
import Papa from 'papaparse';
import Header from './components/Header';
import ManualForm from './components/ManualForm';
import ReviewTable from './components/ReviewTable';
import InvoiceExtractor from './components/InvoiceExtractor';
import SettingsManager from './components/SettingsManager';
import { FileSpreadsheet, Inbox, Trash2, Cloud, DownloadCloud } from 'lucide-react';

import './styles/App.css';
import './styles/Components.css';
import './styles/Table.css';

function App() {
  const [productosEnRevision, setProductosEnRevision] = useState([]);
  const [politicas, setPoliticas] = useState([]); 
  const [sincronizado, setSincronizado] = useState(false);

  // 1. Cargar políticas globalmente
  const fetchPoliticas = async () => {
    try {
      const { data, error } = await supabase.from('politicas_comerciales').select('*');
      if (error) throw error;
      if (data) setPoliticas(data);
    } catch (error) {
      console.error("Error al obtener políticas:", error.message);
    }
  };

  // 2. Efecto inicial para cargar políticas al abrir la app
  useEffect(() => {
    fetchPoliticas();
  }, []);

  // 3. Cargar datos de productos desde Supabase (Bandeja de entrada)
  const cargarDesdeDB = async () => {
    const { data, error } = await supabase.from('productos').select('*');

    if (error) return alert("Error al cargar: " + error.message);
    
    const existentesIds = productosEnRevision.map(p => p.id);
    const nuevos = data.filter(p => !existentesIds.includes(p.id));
    
    setProductosEnRevision(prev => [...prev, ...nuevos]);
    alert(`${nuevos.length} productos cargados desde la base de datos.`);
  };

  // 4. Actualizar campos en la bandeja
  const actualizarCampo = (id, campo, valor) => {
    setSincronizado(false);
    setProductosEnRevision(prev => 
      prev.map(p => (p.id === id || p.id_temporal === id) ? { ...p, [campo]: valor } : p)
    );
  };

  // 5. Eliminar de la bandeja
  const eliminarProducto = (id) => {
    setProductosEnRevision(prev => prev.filter(p => p.id !== id && p.id_temporal !== id));
  };

  // 6. Sincronizar con Supabase (Upsert)
  const subirASupabase = async () => {
    if (productosEnRevision.length === 0) return;
    
    const datosFinales = productosEnRevision.map(({ id_temporal, ...resto }) => ({
      ...resto,
      tipo_articulo: 'Está en el inventario',
      cuenta_ingresos: 'Ingresos de ventas de productos',
      cuenta_gastos: 'Costo de las ventas',
      cuenta_activo: 'Activo de inventario'
    }));

    const { error } = await supabase.from('productos').upsert(datosFinales, { onConflict: 'id' });
    
    if (error) {
      alert("Error: " + error.message);
    } else {
      setSincronizado(true);
      alert("¡Sincronizado con Supabase correctamente!");
    }
  };

  // 7. Exportar CSV para QuickBooks Online
  const exportarACSV = () => {
    if (productosEnRevision.length === 0) return alert("Bandeja vacía");

    const hoy = new Date();
    const fechaQBO = `${String(hoy.getMonth() + 1).padStart(2, '0')}/${String(hoy.getDate()).padStart(2, '0')}/${hoy.getFullYear()}`;

    const mapeoQBO = productosEnRevision.map(p => ({
      "Nombre del producto/servicio": p.nombre || '',
      "Categoría": p.categoria || '',
      "Tipo de artículo": "Está en el inventario",
      "Unidad de mantenimiento de existencias": p.sku || '',
      "Descripción de las ventas": p.nombre || '',
      "Precio/tarifa de venta": p.precio_venta || 0,
      "Cuenta de ingresos": "Ingresos de ventas de productos",
      "Descripción de las compras": p.nombre || '',
      "Costo de compra": p.costo_compra || 0,
      "Cuenta de gastos": "Costo de las ventas",
      "Cantidad en existencia": p.cantidad_existencia || 0,
      "Cantidad en la fecha": fechaQBO,
      "Punto de reabastecimiento": 0,
      "Cuenta de activos de inventario": "Activo de inventario"
    }));

    const csv = Papa.unparse(mapeoQBO, { delimiter: ";", header: true });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Importar_QBO_${hoy.getTime()}.csv`;
    link.click();
  };

  return (
    <div className="container">
      <Header onUpload={subirASupabase} />
      
      <div className="layout-grid">
        <ManualForm 
          politicas={politicas} 
          onAdd={(prod) => {
            setProductosEnRevision([...productosEnRevision, prod]);
            setSincronizado(false);
          }} 
        />
        
        <div className="card central-panel">
          <div className="tab-container">
            <div className="tab-info">
              <Inbox size={18} />
              <h3>Bandeja de Revisión ({productosEnRevision.length})</h3>
            </div>
            <div className="tab-actions">
              <button className="btn-load-db" onClick={cargarDesdeDB}>
                <DownloadCloud size={16} /> Cargar de DB
              </button>
              <button className="btn-export-csv" onClick={exportarACSV}>
                <FileSpreadsheet size={16} /> Exportar CSV
              </button>
            </div>
          </div>

          <ReviewTable 
            productos={productosEnRevision} 
            onUpdate={actualizarCampo} 
            onDelete={eliminarProducto} 
          />

          {productosEnRevision.length > 0 && (
            <div className="panel-footer">
              <div className={`status-indicator ${sincronizado ? 'synced' : 'pending'}`}>
                <Cloud size={16} /> {sincronizado ? 'Sincronizado' : 'Cambios Pendientes'}
              </div>
              <button className="btn-clear-all" onClick={() => setProductosEnRevision([])}>
                <Trash2 size={16} /> Vaciar Mesa
              </button>
            </div>
          )}
        </div>
        
        <InvoiceExtractor onExtract={(prods) => {
          setProductosEnRevision([...productosEnRevision, ...prods]);
          setSincronizado(false);
        }} />
      </div>

      <div className="bottom-section">
        <div className="placeholder-card">
          <div className="placeholder-content">
            <p>Módulo Secundario</p>
            <span>Espacio reservado para script futuro</span>
          </div>
        </div>

        <SettingsManager politicas={politicas} onRefresh={fetchPoliticas} />
      </div>
    </div>
  );
}

export default App;