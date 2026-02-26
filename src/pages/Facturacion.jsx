import React, { useEffect, useRef } from 'react';
import { Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useFacturacion } from '../hooks/useFacturacion';

// Sub-componentes
import F_Header from '../components/facturacion/F_Header';
import F_EmptyState from '../components/facturacion/F_EmptyState';
import ReviewTable from '../components/facturacion/F_ReviewTable';
import InboxDrawer from '../components/facturacion/InboxDrawer';

// Styles
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

  // REFERENCIA PARA EVITAR DOBLE EJECUCIÓN
  const exchangeStarted = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const rId = params.get('realmId');

    if (code && rId && !exchangeStarted.current) {
      exchangeStarted.current = true;

      const handleTokenExchange = async () => {
        try {
          console.log("Intentando forzar intercambio de tokens para:", rId);
          
          // 1. Validar sesión localmente
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            console.error("Fallo de sesión:", sessionError);
            throw new Error("No hay sesión activa. Por favor, re-autentícate.");
          }

          // 2. INVOCACIÓN FORZADA
          // Pasamos el token explícitamente en el header estándar de Supabase
          const { data, error } = await supabase.functions.invoke('qbo-oauth-handler', {
            body: { code, realmId: rId },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'x-client-info': 'supabase-js-force' 
            }
          });

          if (error) {
            console.error("Error devuelto por la Edge Function:", error);
            throw error;
          }

          console.log("✅ Intercambio exitoso en servidor:", data?.message);

          // 3. Persistir estado localmente antes de limpiar
          localStorage.setItem('qbo_connected', 'true');
          localStorage.setItem('qbo_realmId', rId);
          
          // 4. Limpieza de URL y recarga controlada
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
          console.log("Recargando aplicación para aplicar cambios...");
          window.location.reload(); 

        } catch (err) {
          console.error("❌ Error crítico en OAuth:", err);
          
          // Limpiar URL incluso en error para evitar bucles de códigos expirados
          window.history.replaceState({}, document.title, window.location.pathname);
          
          alert(`Error de conexión: ${err.message || "La comunicación falló"}`);
          exchangeStarted.current = false;
        }
      };

      handleTokenExchange();
    }
  }, []);

  const handleConnectQBO = () => {
    const clientId = 'ABHJF9iKHUtsgJwew9TtBQmoFjal8zRArUbW4DRFUXlTFLu5PQ';
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
          if (window.confirm('¿Vaciar bandeja?')) {
            const { error } = await supabase.from('facturas_pendientes').delete().not('id', 'is', null);
            if (!error) fetchPendientes();
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