import React, { useEffect, useRef } from 'react';
import { Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useFacturacion } from '../hooks/useFacturacion';

// Sub-componentes
import F_Header from '../components/facturacion/F_Header';
import F_EmptyState from '../components/facturacion/F_EmptyState';
import ReviewTable from '../components/facturacion/F_ReviewTable';
import InboxDrawer from '../components/facturacion/InboxDrawer';

// styles
import '../styles/Facturacion/facturacion.css';

const Facturacion = () => {
  const {
    invoiceData, 
    setInvoiceData, 
    isConnected, 
    realmId, 
    pendientes, 
    isDrawerOpen, 
    setIsDrawerOpen, 
    fetchPendientes,
    processNewInvoice, 
    handleUpdateItem,
    qboAccounts,
    qboVendors,
    enviarAQuickBooks 
  } = useFacturacion();

  // REFERENCIA PARA EVITAR DOBLE EJECUCIÓN (Strict Mode)
  const exchangeStarted = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const rId = params.get('realmId');

    if (code && rId && !exchangeStarted.current) {
      exchangeStarted.current = true;

      const handleTokenExchange = async () => {
        try {
          console.log("Iniciando intercambio de tokens para RealmID:", rId);
          
          // 1. Obtener la sesión actual para asegurar que el usuario está autenticado
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            throw new Error("No se encontró una sesión de usuario activa. Por favor, inicia sesión.");
          }

          // 2. Invocar la función
          // NOTA: No pasamos headers manuales para que el SDK use el token de la sesión automáticamente
          const { data, error } = await supabase.functions.invoke('qbo-oauth-handler', {
            body: { code, realmId: rId }
          });

          if (error) throw error;

          console.log("✅ Intercambio exitoso en el servidor");

          // 3. Guardar estado de conexión ANTES de limpiar la URL
          localStorage.setItem('qbo_connected', 'true');
          localStorage.setItem('qbo_realmId', rId);

          // 4. Limpiar la URL para eliminar el código de un solo uso
          window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
          
          // 5. Recargar para que useFacturacion actualice el estado global
          window.location.reload(); 
        } catch (err) {
          console.error("❌ Error en intercambio OAuth:", err);
          
          // Limpiar URL incluso en caso de fallo para permitir reintentos limpios
          window.history.replaceState({}, document.title, window.location.pathname);
          
          alert(`Error de conexión: ${err.message || "El código de QuickBooks ya expiró o es inválido."}`);
          exchangeStarted.current = false;
        }
      };

      handleTokenExchange();
    }
  }, []);

  const handleConnectQBO = () => {
    const clientId = 'ABHJF9iKHUtsgJwew9TtBQmoFjal8zRArUbW4DRFUXlTFLu5PQ';
    
    // URI exacta registrada en Intuit (sin / al final)
    const redirectUri = encodeURIComponent('https://qbo-export-app.vercel.app'); 
    const state = `pma_${Math.random().toString(36).substring(7)}`;

    window.location.href = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${redirectUri}&state=${state}`;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => processNewInvoice(event.target.result);
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div className="facturacion-container">
      <button 
        className="floating-inbox-btn" 
        onClick={() => setIsDrawerOpen(true)}
        title="Bandeja de facturas pendientes"
      >
        <Mail size={24} />
        {pendientes.length > 0 && <span className="notif-dot">{pendientes.length}</span>}
      </button>

      <InboxDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        pendientes={pendientes}
        onSelect={(f) => { 
          processNewInvoice(f.xml_content, f.id); 
          setIsDrawerOpen(false); 
        }}
        onDelete={async (id) => {
          const { error } = await supabase.from('facturas_pendientes').delete().eq('id', id);
          if (!error) fetchPendientes();
        }} 
        onDeleteAll={async () => {
          if (window.confirm('¿Estás seguro de que deseas eliminar TODAS las facturas de la bandeja?')) {
            try {
              const { error } = await supabase
                .from('facturas_pendientes')
                .delete()
                .not('id', 'is', null);

              if (error) throw error;
              
              await fetchPendientes();
              alert('Bandeja vaciada con éxito');
            } catch (error) {
              console.error("Error al eliminar facturas:", error.message);
              alert('No se pudieron eliminar las facturas: ' + error.message);
            }
          }
        }}
      />

      <F_Header 
        isConnected={isConnected} 
        realmId={realmId} 
        onConnect={handleConnectQBO} 
        onLogout={() => { 
          localStorage.removeItem('qbo_connected');
          localStorage.removeItem('qbo_realmId');
          window.location.reload(); 
        }} 
        onRefresh={fetchPendientes} 
      />

      <main className="facturacion-content">
        {invoiceData ? (
          <ReviewTable 
            data={invoiceData} 
            qboAccounts={qboAccounts}
            qboVendors={qboVendors}
            onUpdateItem={handleUpdateItem}
            onSendToQBO={enviarAQuickBooks} 
            onClearTable={() => setInvoiceData(null)}
          />
        ) : (
          <F_EmptyState onFileUpload={handleFileUpload} />
        )}
      </main>
    </div>
  );
};

export default Facturacion;