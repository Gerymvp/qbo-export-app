import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase'; 
import { parseInvoiceXML } from '../utils/xmlParser';
import ReviewTable from '../components/facturacion/ReviewTable';
import InboxDrawer from '../components/facturacion/InboxDrawer';
import { Mail, RefreshCw, LogOut, UploadCloud, Link as LinkIcon } from 'lucide-react';

// Importación de estilos externos
import '../styles/Facturacion/facturacion.css';
import '../styles/btn.css';

const Facturacion = () => {
  const [invoiceData, setInvoiceData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realmId, setRealmId] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const status = localStorage.getItem('qbo_connected');
      const rId = localStorage.getItem('qbo_realmId');
      setIsConnected(status === 'true');
      setRealmId(rId);
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleConnectQBO = () => {
    const clientId = 'ABK9ko4wbz4pMUSYqrcqqlHIKKeqXXlJ6AODNyy9Khl6X9td6V';
    const redirectUri = encodeURIComponent('http://localhost:5173/'); 
    const scope = 'com.intuit.quickbooks.accounting';
    const state = 'pma_' + Math.random().toString(36).substring(7);
    window.location.href = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`;
  };

  const handleLogoutQBO = () => {
    localStorage.removeItem('qbo_connected');
    localStorage.removeItem('qbo_realmId');
    setIsConnected(false);
    setRealmId(null);
  };

  const handleUpdateItem = (index, field, value) => {
    const newData = { ...invoiceData };
    const item = newData.items[index];

    if (field === 'taxSelected') {
      item.taxSelected = value;
      const totalFijo = Number(item.totalOriginal);
      const cantidad = Number(item.cantidad);

      if (value === true) {
        const baseImponible = totalFijo / 1.07;
        const impuesto = totalFijo - baseImponible;
        item.precioUnitario = baseImponible / cantidad;
        item.valITBMS = impuesto;
        item.totalItem = totalFijo; 
      } else {
        item.precioUnitario = totalFijo / cantidad;
        item.valITBMS = 0;
        item.totalItem = totalFijo;
      }
    } else {
      item[field] = value;
    }
    setInvoiceData(newData);
  };

  const processNewInvoice = (xmlContent) => {
    const parsed = parseInvoiceXML(xmlContent);
    parsed.items = parsed.items.map(it => ({ 
      ...it, 
      totalOriginal: Number(it.totalItem), 
      taxSelected: false,
      valITBMS: 0,
      totalItem: Number(it.totalItem),
      precioUnitario: Number(it.precioUnitario)
    }));
    setInvoiceData(parsed);
  };

  const fetchPendientes = useCallback(async () => {
    const { data, error } = await supabase
      .from('facturas_pendientes')
      .select('*')
      .eq('status', 'pendiente')
      .order('fecha_recepcion', { ascending: false }); 
    if (!error) setPendientes(data || []);
  }, []);

  useEffect(() => {
    fetchPendientes();
    const channel = supabase.channel('facturas-gmail')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'facturas_pendientes' }, fetchPendientes)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchPendientes]);

  const handleSelectPendiente = (factura) => {
    processNewInvoice(factura.xml_content);
    setIsDrawerOpen(false);
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
        onSelect={handleSelectPendiente}
        onDelete={async (id) => {
           const { error } = await supabase.from('facturas_pendientes').delete().eq('id', id);
           if (!error) fetchPendientes();
        }} 
      />

      <header className="facturacion-header-dashboard">
        <div>
          <h2>Gestor de Facturas</h2>
          <span className={`status-pill ${isConnected ? 'active' : 'inactive'}`}>
            {isConnected ? `🟢 Empresa: ${realmId}` : "🔴 QuickBooks Desconectado"}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isConnected ? (
            <button className="btn btn-danger" onClick={handleLogoutQBO}>
              <LogOut size={16} /> Cerrar Sesión
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleConnectQBO}>
              <LinkIcon size={16} /> Conectar QuickBooks
            </button>
          )}
          
          <button className="btn btn-primary" onClick={fetchPendientes}>
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      <main>
        {invoiceData ? (
          <ReviewTable 
            data={invoiceData} 
            onUpdateItem={handleUpdateItem}
            onSendToQBO={() => alert("Enviando a QBO...")}
            onClearTable={() => setInvoiceData(null)}
          />
        ) : (
          <div className="empty-state-card">
            <UploadCloud size={48} color="#cbd5e1" />
            <h3>Cargar Factura</h3>
            <label className="btn btn-success" style={{ marginTop: '20px', cursor: 'pointer' }}>
              Subir XML Local
              <input type="file" accept=".xml" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}
      </main>
    </div>
  );
};

export default Facturacion;