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

  // 3. Gestión de Facturas Pendientes (Base de Datos)
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

  // 4. Procesamiento de XML (CORREGIDO PARA INCLUIR EL ID)
  const processNewInvoice = (xmlContent, dbId = null) => {
    try {
      const parsed = parseInvoiceXML(xmlContent);
      parsed.id = dbId; // Mantenemos el ID original de Supabase para el PATCH posterior
      parsed.items = (parsed.items || []).map(it => ({ 
        ...it, 
        totalOriginal: Number(it.totalItem), 
        taxSelected: false,
        valITBMS: 0,
        totalItem: Number(it.totalItem),
        precioUnitario: Number(it.precioUnitario),
        account: '' 
      }));
      setInvoiceData(parsed);
    } catch (err) { 
      console.error("Error en processNewInvoice:", err);
      alert("Error al procesar el XML de la factura."); 
    }
  };

  const handleUpdateItem = (index, field, value) => {
    if (!invoiceData) return;
    const newData = { ...invoiceData };
    if (index === 'header') {
      newData[field] = value;
    } else {
      const item = newData.items[index];
      if (field === 'taxSelected') {
        item.taxSelected = value;
        const totalFijo = Number(item.totalOriginal);
        if (value) {
          const base = totalFijo / 1.07;
          item.precioUnitario = base / item.cantidad;
          item.valITBMS = totalFijo - base;
        } else {
          item.precioUnitario = totalFijo / item.cantidad;
          item.valITBMS = 0;
        }
        item.totalItem = totalFijo;
      } else { 
        item[field] = value; 
      }
    }
    setInvoiceData(newData);
  };

  // 5. Envío a QBO y Actualización de Estado (CORREGIDO)
  const enviarAQuickBooks = async () => {
    if (!invoiceData?.vendorId) return alert("Selecciona un proveedor de QBO.");
    if (invoiceData.items.some(item => !item.account)) return alert("Asigna una cuenta a todos los productos.");

    try {
      const { data: tokenData } = await supabase.from('qbo_tokens').select('access_token').maybeSingle();
      if (!tokenData) throw new Error("Token no encontrado. Reconecta QuickBooks.");

      const billPayload = {
        VendorRef: { value: invoiceData.vendorId },
        Line: invoiceData.items.map(item => ({
          Amount: item.totalItem,
          DetailType: "AccountBasedExpenseLineDetail",
          AccountBasedExpenseLineDetail: { AccountRef: { value: item.account } },
          Description: item.descripcion
        }))
      };

      // 1. Enviar a QBO
      await sendBillToQBO(realmId, tokenData.access_token, billPayload);
      
      // 2. Actualizar estado en Supabase (Solo si hay un ID válido)
      if (invoiceData.id) {
        const { error: updateError } = await supabase
          .from('facturas_pendientes')
          .update({ status: 'procesada' })
          .eq('id', invoiceData.id);
        
        if (updateError) console.error("Error al actualizar estado:", updateError);
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