import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
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

  // 2. Cargar políticas al iniciar
  useEffect(() => {
    if (session) {
      cargarPoliticas();
    }
  }, [session]);

  const cargarPoliticas = async () => {
    const { data } = await supabase.from('politicas_comerciales').select('*');
    if (data) setPoliticas(data);
  };

  // 3. Cargar desde BD (Evitando duplicar lo que ya está en pantalla)
  const cargarDesdeBD = async () => {
    try {
      const { data, error } = await supabase.from('productos').select('*');
      if (error) throw error;

      if (data) {
        const deBaseDatos = data.map(p => ({ 
          ...p, 
          solo_local: false, 
          id_temporal: p.id 
        }));
        
        setProductos(prev => {
          const skusEnPantalla = new Set(prev.map(p => p.sku?.toString().trim()));
          const nuevosNoRepetidos = deBaseDatos.filter(p => p.sku && !skusEnPantalla.has(p.sku.toString().trim()));
          return [...prev, ...nuevosNoRepetidos];
        });
      }
    } catch (err) {
      alert("Error al cargar: " + err.message);
    }
  };

  // 4. Agregar productos (Scraper, Manual, Factura)
  const handleAddBatch = (nuevos) => {
    if (!Array.isArray(nuevos)) return;
    setProductos(prev => {
      const skusEnPantalla = new Set(prev.map(p => p.sku?.toString().trim()));
      const filtrados = nuevos
        .filter(n => n.sku && !skusEnPantalla.has(n.sku.toString().trim()))
        .map(n => ({
          ...n,
          solo_local: true,
          id_temporal: n.id_temporal || crypto.randomUUID()
        }));

      if (filtrados.length === 0 && nuevos.length > 0) {
        alert("Los productos ya están en la lista de revisión.");
        return prev;
      }
      return [...filtrados, ...prev];
    });
  };

  const handleUpdate = (id, campo, valor) => {
    setProductos(prev => prev.map(p => 
      p.id_temporal === id ? { ...p, [campo]: valor } : p
    ));
  };

  const handleDelete = (id) => {
    setProductos(prev => prev.filter(p => p.id_temporal !== id));
  };

  const vaciarBandejaCompleta = () => {
    if (window.confirm("¿Vaciar toda la tabla de revisión?")) setProductos([]);
  };

  // 5. SINCRONIZACIÓN INTELIGENTE (UPSERT)
const handleSincronizar = async () => {
  if (productos.length === 0) return alert("No hay productos para sincronizar.");

  try {
    const datosFinales = productos.map(p => {
      // IMPORTANTE: Si el producto viene de la BD tiene un ID real (UUID)
      // Si es nuevo, NO debemos enviarle un ID para que Supabase lo genere
      const obj = {
        nombre: p.nombre,
        sku: p.sku ? p.sku.toString().trim() : null,
        precio_venta: parseFloat(p.precio_venta) || 0,
        costo_compra: parseFloat(p.costo_compra) || 0,
        cantidad_existencia: parseInt(p.cantidad_existencia) || 0,
        proveedor: p.proveedor || '',
        categoria: p.categoria || ''
      };

      // Solo incluimos el ID si NO es un producto "solo local" (es decir, ya existe en BD)
      if (!p.solo_local && p.id) {
        obj.id = p.id;
      }

      return obj;
    }).filter(p => p.sku !== null);

    const { error } = await supabase
      .from('productos')
      .upsert(datosFinales, { onConflict: 'sku' });

    if (error) throw error;

    alert("¡Sincronización Exitosa!");
    setProductos([]);
    await cargarDesdeBD();

  } catch (error) {
    console.error("Detalle técnico:", error);
    alert("Error de Permisos/RLS: " + error.message);
  }
};

  if (loading) return <div className="loading-state">Cargando...</div>;
  if (!session) return <Login />;

  return (
    <div className="app-container">
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
            onLoadBD={cargarDesdeBD}
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
}

export default App;