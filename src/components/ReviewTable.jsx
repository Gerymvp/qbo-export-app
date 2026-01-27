import React from 'react';
import { supabase } from '../lib/supabase';
import { 
  Package, Trash2, Database, 
  FileSpreadsheet, DownloadCloud, Trash 
} from 'lucide-react';
import Papa from 'papaparse';
import '../styles/ReviewTable.css';

const ReviewTable = ({ productos, onUpdate, onDelete, onClearAll, onAddBatch }) => {

  const cargarDesdeBD = async () => {
    try {
      console.log("Conectando a Supabase...");
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .limit(1000);

      if (error) throw error;

      if (data && data.length > 0) {
        // Formatear para que la tabla reconozca los IDs y el icono de DB
        const productosListos = data.map(p => ({
          ...p,
          id_temporal: p.id, 
          solo_local: false 
        }));

        // Ejecutar la función que viene de App.jsx
        if (onAddBatch) {
          onAddBatch(productosListos);
          alert(`✅ ${data.length} productos cargados desde la base de datos.`);
        } else {
          console.error("Error: La prop 'onAddBatch' no llegó al componente.");
          alert("Error interno: No se encontró la función de carga.");
        }
      } else {
        alert("La base de datos está vacía.");
      }
    } catch (err) {
      console.error("Error completo:", err);
      alert("Error al cargar: " + (err.message || "Problema de conexión"));
    }
  };

  const exportarExcel = () => {
    if (productos.length === 0) return alert("Bandeja vacía");
    
    const datosExportar = productos.map(p => {
      const fechaObj = p.fecha_inventario ? new Date(p.fecha_inventario) : new Date();
      const mm = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
      const dd = fechaObj.getDate().toString().padStart(2, '0');
      const yyyy = fechaObj.getFullYear();
      const fechaString = `${mm}/${dd}/${yyyy}`;

      return {
        "Producto/Servicio": p.nombre || '',
        "Tipo": "Está en el inventario", 
        "SKU": p.sku || '',
        "Categoría": p.categoria || '',
        "Descripción de las ventas": p.nombre || '',
        "Precio/tarifa de venta": p.precio_venta || 0,
        "Cuenta de ingresos": "Ingresos de ventas de productos",
        "Descripción de las compras": p.nombre || '',
        "Costo de compra": p.costo_compra || 0,
        "Cuenta de gastos": "Costo de las ventas",
        "Cantidad en existencia": p.cantidad_existencia || 0,
        "Cantidad en la fecha": fechaString,
        "Punto de reabastecimiento": p.punto_reorden || 0,
        "Cuenta de activos de inventario": "Activo de inventario"
      };
    });

    const csv = Papa.unparse(datosExportar, { delimiter: ",", header: true });
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Carga_QBO_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="title-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={20} color="#2ca01c" />
          <h3>Revisión ({productos.length})</h3>
        </div>
        <div className="action-group" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={cargarDesdeBD}>
            <DownloadCloud size={16} /> Cargar BD
          </button>
          <button className="btn btn-success" onClick={exportarExcel}>
            <FileSpreadsheet size={16} /> Exportar QBO
          </button>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="review-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>Origen</th>
              <th>Producto</th>
              <th>SKU</th>
              <th>Precio</th>
              <th>Costo</th>
              <th>Stock</th>
              <th className="cell-center"></th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr><td colSpan="7" className="empty-msg" style={{ textAlign: 'center', padding: '20px' }}>Bandeja vacía</td></tr>
            ) : (
              productos.map(p => {
                const id = p.id_temporal || p.id;
                return (
                  <tr key={id} className={p.solo_local ? 'local-row' : ''}>
                    <td className="cell-center">
                      {p.solo_local ? <Package size={14} color="#2ca01c" /> : <Database size={14} color="#0077c5" />}
                    </td>
                    <td><input className="input-ghost" value={p.nombre || ''} onChange={e => onUpdate(id, 'nombre', e.target.value)} /></td>
                    <td><input className="input-ghost" value={p.sku || ''} onChange={e => onUpdate(id, 'sku', e.target.value)} /></td>
                    <td><input className="input-ghost" type="number" value={p.precio_venta || 0} onChange={e => onUpdate(id, 'precio_venta', e.target.value)} /></td>
                    <td><input className="input-ghost" type="number" value={p.costo_compra || 0} onChange={e => onUpdate(id, 'costo_compra', e.target.value)} /></td>
                    <td><input className="input-ghost" type="number" value={p.cantidad_existencia || 0} onChange={e => onUpdate(id, 'cantidad_existencia', e.target.value)} /></td>
                    <td className="cell-center">
                      <button className="btn btn-danger" onClick={() => onDelete(id)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="review-footer">
        <button className="btn btn-danger" onClick={onClearAll}><Trash size={14} /> Vaciar Bandeja</button>
      </div>
    </div>
  );
};

export default ReviewTable;