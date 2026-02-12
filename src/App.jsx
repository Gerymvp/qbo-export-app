import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase.js';

// Componentes
import Sidebar from './components/Sidebar';
import Login from './components/Login/index.jsx';
import Dashboard from './pages/Dashboard';
import Facturacion from './pages/Facturacion';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [politicas, setPoliticas] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  // 1. --- 🛡️ GESTIÓN DE SESIÓN SUPABASE ---
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

  // 2. --- 🔗 CAPTURA Y VINCULACIÓN DE QUICKBOOKS ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const realmId = params.get('realmId');

    if (code && realmId && session?.user?.id) {
      
      // 🚀 SOLUCIÓN AL BUCLE: Limpiamos la URL inmediatamente antes de invocar la función
      // Esto evita que si el componente se re-renderiza, vuelva a entrar aquí.
      window.history.replaceState({}, document.title, "/");

      const vincularQuickBooks = async () => {
        try {
          console.log("Iniciando intercambio de tokens único para:", session.user.id);
          
          const { data, error } = await supabase.functions.invoke('qbo-oauth-handler', {
            body: { 
              code: code, 
              realmId: realmId,
              userId: session.user.id 
            }
          });

          if (error) throw error;

          // Guardamos éxito en local para persistencia visual
          localStorage.setItem('qbo_connected', 'true');
          localStorage.setItem('qbo_realmId', realmId);
          
          setCurrentView('facturacion');
          alert("¡Conexión exitosa con QuickBooks!");
          
          // Opcional: Recargar para asegurar que todos los hooks lean el nuevo estado del localStorage
          window.location.reload();

        } catch (err) {
          // Si el error es 400 pero ya vemos que estamos conectados, lo ignoramos (fue un re-intento fantasma)
          if (localStorage.getItem('qbo_connected') === 'true') return;

          console.error("Error en el intercambio de OAuth:", err);
          alert("Error de conexión: El código de QuickBooks ya expiró o es inválido. Intenta conectar de nuevo.");
        }
      };

      vincularQuickBooks();
    }
  }, [session]);

  // 3. --- 📊 CARGA DE DATOS DE NEGOCIO ---
  const cargarPoliticas = useCallback(async () => {
    const { data, error } = await supabase.from('politicas_comerciales').select('*');
    if (!error && data) setPoliticas(data);
  }, []);

  useEffect(() => { 
    if (session) cargarPoliticas(); 
  }, [session, cargarPoliticas]);

  // --- RENDERIZADO ---
  if (loading) return (
    <div className="loading-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
      Cargando sistema...
    </div>
  );

  if (!session) return <Login />;

  return (
    <div className="main-layout">
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <div className="content-wrapper">
        {currentView === 'dashboard' && (
          <Dashboard 
            politicas={politicas} 
            cargarPoliticas={cargarPoliticas} 
          />
        )}

        {currentView === 'facturacion' && (
          <Facturacion />
        )}

        {currentView === 'inventario' && (
          <div style={{padding:'40px'}}>
            <h1>Inventario Pro</h1>
            <p>Módulo conectado a QuickBooks</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;