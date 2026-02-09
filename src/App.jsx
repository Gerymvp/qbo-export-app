import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';

// Componentes
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Facturacion from './pages/Facturacion';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [politicas, setPoliticas] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  // --- 🛡️ CAPTURA DE CONEXIÓN QBO ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const realmId = params.get('realmId');

    if (code && realmId) {
      localStorage.setItem('qbo_connected', 'true');
      localStorage.setItem('qbo_realmId', realmId);
      localStorage.setItem('qbo_auth_code', code);
      
      setCurrentView('facturacion');
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

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

  const cargarPoliticas = useCallback(async () => {
    const { data, error } = await supabase.from('politicas_comerciales').select('*');
    if (!error && data) setPoliticas(data);
  }, []);

  useEffect(() => { if (session) cargarPoliticas(); }, [session, cargarPoliticas]);

  if (loading) return <div className="loading-state">Cargando sistema...</div>;
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
        {currentView === 'dashboard' && <Dashboard politicas={politicas} cargarPoliticas={cargarPoliticas} />}
        {currentView === 'facturacion' && <Facturacion />}
        {currentView === 'inventario' && <div style={{padding:'40px'}}><h1>Inventario Pro</h1></div>}
      </div>
    </div>
  );
}

export default App;