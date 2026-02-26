import React from 'react';
import { Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useFacturacion } from '../hooks/useFacturacion';

// Sub-componentes
import F_Header from '../components/facturacion/F_Header';
import F_EmptyState from '../components/facturacion/F_EmptyState';
import ReviewTable from '../components/facturacion/F_ReviewTable';
import InboxDrawer from '../components/facturacion/InboxDrawer';

//styles
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
    // --- EXTRACCIÓN DE LA FUNCIÓN DESDE EL HOOK ---
    enviarAQuickBooks 
  } = useFacturacion();

  // Handlers locales para la interfaz
const handleConnectQBO = () => {
  const clientId = 'ABHJF9iKHUtsgJwew9TtBQmoFjal8zRArUbW4DRFUXlTFLu5PQ';
  
  // USA UNA URL FIJA QUE COINCIDA CON EL PANEL DE INTUIT
  // Asegúrate de que esta URL sea EXACTAMENTE la que tienes en la captura de pantalla
  const redirectUriStr = 'https://qbo-export-app.vercel.app/'; 
  const redirectUri = encodeURIComponent(redirectUriStr); 

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

      {/* CORRECCIÓN: Aseguramos que onDeleteAll se pase como prop 
          para que coincida con la desestructuración en InboxDrawer.jsx 
      */}
      <InboxDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        pendientes={pendientes}
        onSelect={(f) => { processNewInvoice(f.xml_content); setIsDrawerOpen(false); }}
        onDelete={async (id) => {
          await supabase.from('facturas_pendientes').delete().eq('id', id);
          fetchPendientes();
        }} 
        onDeleteAll={async () => {
            if (window.confirm('¿Estás seguro de que deseas eliminar TODAS las facturas de la bandeja?')) {
              try {
                // Opción A: Eliminar usando un filtro que siempre sea verdadero para todos los registros
                const { error } = await supabase
                  .from('facturas_pendientes')
                  .delete()
                  .not('id', 'is', null); // Esto selecciona todos los registros que tengan un ID

                if (error) throw error;
                
                // Refrescar la lista local inmediatamente
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
        onLogout={() => { localStorage.clear(); window.location.reload(); }} 
        onRefresh={fetchPendientes} 
      />

      <main>
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