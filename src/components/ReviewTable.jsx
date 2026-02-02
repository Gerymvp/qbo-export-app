import React, { useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Package, Trash2, Database, 
  FileSpreadsheet, DownloadCloud, Trash, AlertTriangle 
} from 'lucide-react';
import Papa from 'papaparse';
import '../styles/ReviewTable.css';

const ReviewTable = ({ productos, onUpdate, onDelete, onClearAll, onAddBatch }) => {

  // 1. Lógica para detectar duplicados por SKU (Memorizada para rendimiento)
  const skuCounts = useMemo(() => {
    return productos.reduce((acc, p) => {
      const sku = p.sku?.toString().trim().toLowerCase();
      if (sku) {
        acc[sku] = (acc[sku] || 0) + 1;
      }
      return acc;
    }, {});
  }, [productos]);

  // 2. Cargar datos desde Supabase
  const cargarDesdeBD = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .limit(1000);

      if (error) throw error;

      if (data && data.length > 0) {
        const productosListos = data.map(p => ({
          ...p,
          id_temporal: p.id, 
          solo_local: false 
        }));

        if (onAddBatch) {
          onAddBatch(productosListos);
        }
      } else {
        alert("La base de datos está vacía.");
      }
    } catch (err) {
      alert("Error al cargar: " + (err.message || "Problema de conexión"));
    }
  };

  // 3. Exportación formateada para QuickBooks Online
  const exportarExcel = () => {
    if (productos.length === 0) return alert("Bandeja vacía");
    
    const tieneDuplicados = Object.values(skuCounts).some(count => count > 1);
    if (tieneDuplicados) {
      if (!window.confirm("⚠️ Tienes productos duplicados. ¿Deseas exportar de todos modos?")) return;
    }
    
    const datosExportar = productos.map(p => {
      const fechaObj = p.fecha_inventario ? new Date(p.fecha_inventario) : new Date();
      const mm = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
      const dd = fechaObj.getDate().toString().padStart(2, '0');
      const yyyy = fechaObj.getFullYear();

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
        "Cantidad en la fecha": `${mm}/${dd}/${yyyy}`,
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
      {/* HEADER DE LA TARJETA */}
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

      {/* CONTENEDOR CON SCROLL Y TABLA STICKY */}
      <div className="table-scroll-container">
        <table className="review-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Origen</th>
              <th style={{ width: '250px' }}>Producto</th>
              <th style={{ width: '150px' }}>SKU</th>
              <th style={{ width: '100px' }}>Precio</th>
              <th style={{ width: '100px' }}>Costo</th>
              <th style={{ width: '100px' }}>Stock</th>
              <th style={{ width: '60px' }} className="cell-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-msg" style={{ textAlign: 'center', padding: '40px' }}>
                  Bandeja vacía. Agrega productos manualmente o desde el scraper.
                </td>
              </tr>
            ) : (
              productos.map(p => {
                const id = p.id_temporal || p.id;
                const skuNormalizado = p.sku?.toString().trim().toLowerCase();
                const esDuplicado = skuCounts[skuNormalizado] > 1;

                return (
                  <tr 
                    key={id} 
                    className={`${p.solo_local ? 'local-row' : ''} ${esDuplicado ? 'row-duplicate' : ''}`}
                  >
                    <td className="cell-center">
                      {esDuplicado ? (
                        <AlertTriangle size={16} color="#ef4444" title="SKU Duplicado" />
                      ) : (
                        p.solo_local ? (
                          <Package size={14} color="#2ca01c" title="Nuevo (Local)" />
                        ) : (
                          <Database size={14} color="#0077c5" title="Sincronizado (DB)" />
                        )
                      )}
                    </td>
                    <td>
                      <input 
                        className="input-ghost" 
                        value={p.nombre || ''} 
                        onChange={e => onUpdate(id, 'nombre', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        className={`input-ghost ${esDuplicado ? 'input-error' : ''}`} 
                        value={p.sku || ''} 
                        onChange={e => onUpdate(id, 'sku', e.target.value)} 
                        placeholder="SKU"
                      />
                    </td>
                    <td>
                      <input 
                        className="input-ghost" 
                        type="number" 
                        value={p.precio_venta || 0} 
                        onChange={e => onUpdate(id, 'precio_venta', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        className="input-ghost" 
                        type="number" 
                        value={p.costo_compra || 0} 
                        onChange={e => onUpdate(id, 'costo_compra', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        className="input-ghost" 
                        type="number" 
                        value={p.cantidad_existencia || 0} 
                        onChange={e => onUpdate(id, 'cantidad_existencia', e.target.value)} 
                      />
                    </td>
                    <td className="cell-center">
                      <button 
                        className="btn btn-danger-soft" 
                        onClick={() => onDelete(id)}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER DE LA TARJETA */}
      <div className="review-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-danger" onClick={onClearAll}>
          <Trash size={14} /> Vaciar Bandeja
        </button>
        
        {Object.values(skuCounts).some(c => c > 1) && (
          <div className="warning-text" style={{ color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={16} /> SKUs duplicados detectados
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewTable;