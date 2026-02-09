import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Componentes que ya tienes creados
import Header from '../components/Header';
import ReviewTable from '../components/ReviewTable';
import BulkScraper from '../components/BulkScraper';
import ManualForm from '../components/ManualForm';
import SettingsManager from '../components/SettingsManager';
import InvoiceExtractor from '../components/InvoiceExtractor';

const Dashboard = ({ politicas, cargarPoliticas }) => {
  const [productos, setProductos] = useState([]);

  // Al cargar el Dashboard, traemos los productos de la BD
  useEffect(() => {
    cargarDesdeBD();
  }, []);

  // --- FUNCIONES DE PRODUCTOS (Lógica que movimos de App.jsx) ---
  const handleAddBatch = (nuevos) => {
    const procesados = nuevos.map(n => ({
      ...n,
      id_temporal: n.id || `${Date.now()}-${Math.random()}`,
      solo_local: n.solo_local !== undefined ? n.solo_local : true
    }));
    setProductos(prev => [...prev, ...procesados]);
  };

  const handleUpdate = (id, field, value) => {
    setProductos(prev => prev.map(p => 
      (p.id_temporal === id || p.id === id) ? { ...p, [field]: value } : p
    ));
  };

  const handleDelete = (id) => {
    setProductos(prev => prev.filter(p => p.id_temporal !== id && p.id !== id));
  };

  const vaciarBandejaCompleta = () => {
    if (window.confirm("¿Vaciar toda la lista actual?")) setProductos([]);
  };

  const cargarDesdeBD = async () => {
    try {
      const { data, error } = await supabase.from('productos').select('*').limit(1000);
      if (error) throw error;
      if (data) {
        const listos = data.map(p => ({ 
          ...p, 
          id_temporal: p.id, 
          solo_local: false 
        }));
        setProductos(listos);
      }
    } catch (err) {
      console.error("Error al cargar:", err.message);
    }
  };

  const handleSincronizar = async () => {
    if (productos.length === 0) return alert("No hay datos para sincronizar.");

    const skus = productos.map(p => p.sku?.toString().trim().toLowerCase());
    const tieneDuplicados = skus.some((sku, index) => skus.indexOf(sku) !== index);

    if (tieneDuplicados) return alert("❌ SKUs duplicados detectados.");

    try {
      const datosFinales = productos.map(p => {
        const item = {
          sku: p.sku,
          nombre: p.nombre,
          precio_venta: parseFloat(p.precio_venta) || 0,
          costo_compra: parseFloat(p.costo_compra) || 0,
          cantidad_existencia: parseInt(p.cantidad_existencia) || 0,
          categoria: p.categoria || '',
          punto_reorden: p.punto_reorden || 0,
          fecha_inventario: p.fecha_inventario || new Date().toISOString()
        };
        // Si no es solo local, incluimos el ID para que UPSERT actualice en vez de crear nuevo
        if (!p.solo_local && p.id) item.id = p.id;
        return item;
      });

      const { error } = await supabase.from('productos').upsert(datosFinales, { onConflict: 'sku' });
      if (error) throw error;

      alert("¡Sincronización Exitosa con Supabase!");
      await cargarDesdeBD(); // Recargamos para limpiar estados de 'solo_local'
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="dashboard-view">
      <Header onUpload={handleSincronizar} />
      <main className="dashboard-grid">
        <div style={{ gridColumn: 'span 1' }}>
          <ManualForm politicas={politicas} onAdd={(p) => handleAddBatch([p])} />
        </div>
        <div style={{ gridColumn: 'span 4' }}>
          <ReviewTable 
            productos={productos} 
            onUpdate={handleUpdate} 
            onDelete={handleDelete}
            onClearAll={vaciarBandejaCompleta}
            onAddBatch={handleAddBatch}
          />
        </div>
        <div style={{ gridColumn: 'span 1' }}>
          <InvoiceExtractor onExtract={handleAddBatch} />
        </div>
        <div className="grid-col-3">
          <BulkScraper politicas={politicas} onDataReady={handleAddBatch} />
        </div>
        <div className="grid-col-3">
          <SettingsManager politicas={politicas} onRefresh={cargarPoliticas} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;