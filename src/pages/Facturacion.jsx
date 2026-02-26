import React, { useEffect, useRef } from 'react';
import { Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useFacturacion } from '../hooks/useFacturacion';

import F_Header from '../components/facturacion/F_Header';
import F_EmptyState from '../components/facturacion/F_EmptyState';
import ReviewTable from '../components/facturacion/F_ReviewTable';
import InboxDrawer from '../components/facturacion/InboxDrawer';

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

  const exchangeStarted = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const rId = params.get('realmId');

    if (code && rId && !exchangeStarted.current) {
      exchangeStarted.current = true;

      const handleTokenExchange = async () => {
        try {
          console.log("Iniciando intercambio para RealmID:", rId);
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            throw new Error("Sesión no activa. Por favor, inicia sesión.");
          }

          // Invocación a la función
          const { data, error } = await supabase.functions.invoke('qbo-oauth-handler', {
            body: { code, realmId: rId },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });

          if (error) throw error;

          // Limpiar parámetros de la URL antes de recargar
          window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);

          localStorage.setItem('qbo_connected', 'true');
          localStorage.setItem('qbo_realmId', rId);
          
          console.log("Intercambio exitoso");
          window.location.reload(); 
        } catch (err) {
          console.error("Error en intercambio OAuth:", err);
          window.history.replaceState({}, document.title, window.location.pathname);
          alert(`Error: ${err.message}`);
          exchangeStarted.current = false;
        }
      };

      handleTokenExchange();
    }
  }, []);

  const handleConnectQBO = () => {
    const clientId = 'ABHJF9iKHUtsgJwew9TtBQmoFjal8zRArUbW4DRFUXlTFLu5PQ';
    // URI EXACTA SEGÚN TU REGISTRO
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
      <button className="floating-inbox-btn" onClick={() => setIsDrawerOpen(true)}>
        <Mail size={24} />
        {pendientes.length > 0 && <span className="notif-dot">{pendientes.length}</span>}
      </button>

      <InboxDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        pendientes={pendientes}
        onSelect={(f) => { processNewInvoice(f.xml_content, f.id); setIsDrawerOpen(false); }}
        onDelete={async (id) => {
          const { error } = await supabase.from('facturas_pendientes').delete().eq('id', id);
          if (!error) fetchPendientes();
        }} 
        onDeleteAll={async () => {
          if (window.confirm('¿Eliminar todas?')) {
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