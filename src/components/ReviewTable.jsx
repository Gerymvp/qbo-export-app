import React from 'react';
import { Package, Trash2, Database } from 'lucide-react';

const ReviewTable = ({ productos, onUpdate, onDelete }) => {
  return (
    <main className="card">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Origen</th>
              <th>Producto</th>
              <th>SKU</th>
              <th>Precio</th>
              <th>Costo</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id_temporal || p.id}>
                <td title={p.id ? "Existe en DB" : "Nuevo"}>
                  {p.id ? <Database size={14} color="#0077c5" /> : <Package size={14} color="#2ca01c" />}
                </td>
                <td><input value={p.nombre} onChange={e => onUpdate(p.id_temporal || p.id, 'nombre', e.target.value)} /></td>
                <td><input className="small-input" value={p.sku} onChange={e => onUpdate(p.id_temporal || p.id, 'sku', e.target.value)} /></td>
                <td><input type="number" className="small-input" value={p.precio_venta} onChange={e => onUpdate(p.id_temporal || p.id, 'precio_venta', e.target.value)} /></td>
                <td><input type="number" className="small-input" value={p.costo_compra} onChange={e => onUpdate(p.id_temporal || p.id, 'costo_compra', e.target.value)} /></td>
                <td><input type="number" className="small-input" value={p.cantidad_existencia} onChange={e => onUpdate(p.id_temporal || p.id, 'cantidad_existencia', e.target.value)} /></td>
                <td><button className="btn-delete" onClick={() => onDelete(p.id_temporal || p.id)}><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {productos.length === 0 && <p className="empty-msg">Bandeja vacía.</p>}
      </div>
    </main>
  );
};

export default ReviewTable;