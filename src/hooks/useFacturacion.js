import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { parseInvoiceXML } from '../utils/xmlParser';
import { sendBillToQBO } from '../services/qboService'; 

export const useFacturacion = () => {
  const [invoiceData, setInvoiceData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realmId, setRealmId] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [qboAccounts, setQboAccounts] = useState([]);
  const [qboVendors, setQboVendors] = useState([]);

  // 1. Sincronización QBO
  const syncQBO = useCallback(() => {
    const status = localStorage.getItem('qbo_connected');
    const rId = localStorage.getItem('qbo_realmId');
    setIsConnected(status === 'true');
    setRealmId(rId);
  }, []);

  useEffect(() => {
    syncQBO();
    window.addEventListener('storage', syncQBO);
    return () => window.removeEventListener('storage', syncQBO);
  }, [syncQBO]);

  // 2. Fetch de Datos QBO
  const fetchQboAccounts = useCallback(async () => {
    if (!isConnected || !realmId) return;
    try {
      const { data, error } = await supabase.functions.invoke('get-qbo-accounts', {
        body: { realmId }
      });
      if (error) throw error;
      setQboAccounts(data.accounts || []);
    } catch (err) {
      console.error("Error QBO Accounts:", err);
    }
  }, [isConnected, realmId]);

  const fetchQboVendors = useCallback(async () => {
    if (!isConnected || !realmId) return;
    try {
      const { data, error } = await supabase.functions.invoke('get-qbo-vendors', {
        body: { realmId }
      });
      if (error) throw error;
      setQboVendors(data.vendors || []);
    } catch (err) {
      console.error("Error QBO Vendors:", err);
    }
  }, [isConnected, realmId]);

  useEffect(() => {
    if (isConnected && realmId) {
      fetchQboAccounts();
      fetchQboVendors();
    }
  }, [isConnected, realmId, fetchQboAccounts, fetchQboVendors]);

  // 3. Gestión de Facturas Pendientes
  const fetchPendientes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('facturas_pendientes')
        .select('*')
        .ilike('status', 'pendiente')
        .order('fecha_recepcion', { ascending: false });

      if (error) throw error;
      setPendientes(data || []);
    } catch (error) {
      console.error('Error cargando pendientes:', error.message);
    }
  }, []);

  useEffect(() => {
    fetchPendientes();
    const channel = supabase
      .channel('cambios-facturas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'facturas_pendientes' }, fetchPendientes)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPendientes]);

  // 4. Procesamiento de XML
// Dentro de useFacturacion.js
const processNewInvoice = (xmlContent, dbId = null) => {
  try {
    const parsed = parseInvoiceXML(xmlContent);
    parsed.id = dbId;
    
    parsed.items = (parsed.items || []).map(it => {
      const totalOriginal = Number(it.totalItem);
      const cantidad = Number(it.cantidad) || 1;
      
      return { 
        ...it, 
        totalOriginal: totalOriginal, 
        taxSelected: false,
        valITBMS: 0,
        totalItem: totalOriginal,
        // CORRECCIÓN: Calcular el unitario real basado en el total del XML
        // Esto absorbe descuentos previos del XML automáticamente
        precioUnitario: totalOriginal / cantidad, 
        account: '' 
      };
    });
    setInvoiceData(parsed);
  } catch (err) { 
    console.error("Error en processNewInvoice:", err);
    alert("Error al procesar el XML."); 
  }
};

  const handleUpdateItem = (index, field, value) => {
    if (!invoiceData) return;
    
    // Clonamos el estado para evitar mutaciones directas
    const newData = { ...invoiceData };
    
    if (index === 'header') {
      newData[field] = value;
    } else {
      // Clonamos el item específico
      const item = { ...newData.items[index] };
      
      if (field === 'taxSelected') {
        item.taxSelected = value;
        const totalFijo = Number(item.totalOriginal);
        const cant = Number(item.cantidad) || 1;

        if (value) {
          // Desglose: Base = Total / 1.07
          const baseTotal = totalFijo / 1.07;
          item.valITBMS = totalFijo - baseTotal;
          item.precioUnitario = baseTotal / cant;
        } else {
          // Sin impuesto: Base = Total
          item.valITBMS = 0;
          item.precioUnitario = totalFijo / cant;
        }
        item.totalItem = totalFijo;
      } else { 
        item[field] = value; 
      }
      
      // Reinsertamos el item clonado en el array
      newData.items[index] = item;
    }
    setInvoiceData(newData);
  };

  // 5. Envío a QBO
  const enviarAQuickBooks = async () => {
    if (!invoiceData?.vendorId) return alert("Selecciona un proveedor de QBO.");
    if (invoiceData.items.some(item => !item.account)) return alert("Asigna una cuenta a todos los productos.");

    try {
      const { data: tokenData } = await supabase.from('qbo_tokens').select('access_token').maybeSingle();
      if (!tokenData) throw new Error("Token no encontrado. Reconecta QuickBooks.");

      const billPayload = {
        VendorRef: { value: invoiceData.vendorId },
        Line: invoiceData.items.map(item => ({
          Amount: Number(item.totalItem).toFixed(2),
          DetailType: "AccountBasedExpenseLineDetail",
          AccountBasedExpenseLineDetail: { AccountRef: { value: item.account } },
          Description: item.descripcion
        }))
      };

      await sendBillToQBO(realmId, tokenData.access_token, billPayload);
      
      if (invoiceData.id) {
        await supabase
          .from('facturas_pendientes')
          .update({ status: 'procesada' })
          .eq('id', invoiceData.id);
      }
      
      alert("Factura enviada a QuickBooks con éxito");
      setInvoiceData(null);
      fetchPendientes();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return {
    invoiceData, setInvoiceData, isConnected, realmId, pendientes, 
    isDrawerOpen, setIsDrawerOpen, fetchPendientes, processNewInvoice, 
    handleUpdateItem, enviarAQuickBooks, qboAccounts, qboVendors
  };
};