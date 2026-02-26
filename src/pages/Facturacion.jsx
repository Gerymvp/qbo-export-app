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

  // REFERENCIA PARA EVITAR QUE REACT DISPARE EL INTERCAMBIO 2 VECES
  const exchangeStarted = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const rId = params.get('realmId');

    if (code && rId && !exchangeStarted.current) {
      exchangeStarted.current = true;

      const handleTokenExchange = async () => {
        try {
          console.log("Iniciando intercambio de tokens único para producción...");
          
          // 1. Obtener sesión activa para garantizar que el cliente esté autenticado
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            throw new Error("No hay sesión activa. Por favor, inicia sesión de nuevo.");
          }

          // 2. INVOCACIÓN FORZADA
          // Quitamos los headers manuales. El SDK inyecta el Bearer token automáticamente.
          // Si esto falla con 401, el problema es la opción "Verify JWT" en el Dashboard de Supabase.
          const { data, error } = await supabase.functions.invoke('qbo-oauth-handler', {
            body: { code, realmId: rId }
          });

          if (error) throw error;

          // 3. Limpiar URL y guardar estado exitoso
          window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
          localStorage.setItem('qbo_connected', 'true');
          localStorage.setItem('qbo_realmId', rId);
          
          console.log("Intercambio exitoso en servidor");
          window.location.reload(); 
        } catch (err) {
          console.error("Error en intercambio OAuth:", err);
          window.history.replaceState({}, document.title, window.location.pathname);
          alert(`Error de conexión: ${err.message}`);
          exchangeStarted.current = false;
        }
      };

      handleTokenExchange();
    }
  }, []);

  const handleConnectQBO = () => {
    const clientId = 'ABHJF9iKHUtsgJwew9TtBQmoFjal8zRArUbW4DRFUXlTFLu5PQ';
    // URL DE PRODUCCIÓN (Asegúrate que coincida con Intuit Developer Portal)
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