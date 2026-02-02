import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

// Componentes de la interfaz
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Header from './components/Header';
import ReviewTable from './components/ReviewTable';
import BulkScraper from './components/BulkScraper';
import ManualForm from './components/ManualForm';
import SettingsManager from './components/SettingsManager';
import InvoiceExtractor from './components/InvoiceExtractor';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]); 
  const [politicas, setPoliticas] = useState([]);
  
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); 

  // 1. Gestión de Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. Cargar políticas
  useEffect(() => {
    if (session) {
      cargarPoliticas();
    }
  }, [session]);

  const cargarPoliticas = async () => {
    const { data } = await supabase.from('politicas_comerciales').select('*');
    if (data) setPoliticas(data);
  };

  // 3. Funciones de Gestión de Productos
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
        setProductos(prev => {
          const actualesIds = new Set(prev.map(prod => prod.id).filter(Boolean));
          const filtrados = listos.filter(d => !actualesIds.has(d.id));
          return [...prev, ...filtrados];
        });
      }
    } catch (err) {
      alert("Error al cargar: " + err.message);
    }
  };

  const handleSincronizar = async () => {
    if (productos.length === 0) return alert("No hay datos para sincronizar.");

    // VALIDACIÓN DE DUPLICADOS
    const skus = productos.map(p => p.sku?.toString().trim().toLowerCase());
    const tieneDuplicados = skus.some((sku, index) => skus.indexOf(sku) !== index);

    if (tieneDuplicados) {
      return alert("❌ Error: Tienes SKUs duplicados. Corrígelos antes de sincronizar.");
    }

    try {
      // CORRECCIÓN PARA EL ERROR DE "ID NULL"
      const datosFinales = productos.map(p => {
        // Creamos un objeto con los datos básicos
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

        // Si el producto YA EXISTÍA en la base de datos (no es solo_local),
        // le pasamos su ID original para que haga UPDATE.
        // Si es NUEVO, no enviamos la propiedad 'id' para que la DB genere uno.
        if (!p.solo_local && p.id) {
          item.id = p.id;
        }

        return item;
      });

      const { error } = await supabase
        .from('productos')
        .upsert(datosFinales, { onConflict: 'sku' });

      if (error) throw error;

      alert("¡Sincronización Exitosa!");
      setProductos([]); 
      await cargarDesdeBD(); 
    } catch (error) {
      console.error("Error en upsert:", error);
      alert("Error de Base de Datos: " + (error.message || "Error al sincronizar"));
    }
  };

  if (loading) return <div className="loading-state">Cargando...</div>;
  if (!session) return <Login />;

  return (
    <div className="main-layout">
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      <div className="content-area">
        {currentView === 'dashboard' ? (
          <>
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
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1 style={{ color: '#1e293b', marginBottom: '10px' }}>
              {currentView === 'inventario' ? 'Inventario Pro' : 'Facturación'}
            </h1>
            <p style={{ color: '#64748b' }}>Esta sección está en desarrollo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;