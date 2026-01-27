import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import '../styles/ManualForm.css';

const ManualForm = ({ onAdd, politicas }) => {
  const [form, setForm] = useState({
    nombre: '', sku: '', precio_venta: '', costo_compra: '', 
    cantidad_existencia: 0, proveedor: '', categoria: ''
  });

  const proveedoresSugeridos = [...new Set(politicas.map(p => p.proveedor))];
  const categoriasSugeridas = [...new Set(politicas.map(p => p.categoria))];

  useEffect(() => {
    const precio = parseFloat(form.precio_venta);
    if (!isNaN(precio) && form.proveedor && form.categoria) {
      const buscarDescuentoRecursivo = (nombreCat) => {
        const regla = politicas.find(
          p => p.proveedor.toLowerCase() === form.proveedor.toLowerCase() && 
               p.categoria.toLowerCase() === nombreCat.toLowerCase()
        );
        if (!regla) return 0;
        if (regla.descuento_porcentaje > 0) return regla.descuento_porcentaje;
        if (regla.categoria_padre) return buscarDescuentoRecursivo(regla.categoria_padre);
        return 0;
      };
      const descuentoFinal = buscarDescuentoRecursivo(form.categoria);
      if (descuentoFinal > 0) {
        const costoCalculado = precio * (1 - (descuentoFinal / 100));
        setForm(prev => ({ ...prev, costo_compra: costoCalculado.toFixed(2) }));
      }
    }
  }, [form.precio_venta, form.proveedor, form.categoria, politicas]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ ...form, id_temporal: Date.now(), fecha_inventario: new Date().toISOString().split('T')[0] });
    setForm({ ...form, nombre: '', sku: '', precio_venta: '', costo_compra: '', cantidad_existencia: 0 });
  };

  return (
    <aside className="card">
      <div className="card-header-icon">
        <PlusCircle size={20} color="#1e293b" />
        <h3>Ingreso Manual</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="manual-form-container">
        <div className="input-field">
          <label>Proveedor</label>
          <input list="manual-prov" value={form.proveedor} onChange={e => setForm({...form, proveedor: e.target.value})} placeholder="Seleccionar..." required />
          <datalist id="manual-prov">{proveedoresSugeridos.map(p => <option key={p} value={p} />)}</datalist>
        </div>

        <div className="input-field">
          <label>Categoría</label>
          <input list="manual-cat" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} placeholder="Seleccionar..." required />
          <datalist id="manual-cat">{categoriasSugeridas.map(c => <option key={c} value={c} />)}</datalist>
        </div>

        <div className="input-field">
          <label>Nombre del Producto</label>
          <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Biblia..." required />
        </div>

        <div className="input-field">
          <label>SKU</label>
          <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="SKU" />
        </div>

        <div className="dual-inputs">
          <div className="input-field">
            <label>Precio</label>
            <input type="number" step="0.01" value={form.precio_venta} onChange={e => setForm({...form, precio_venta: e.target.value})} required />
          </div>
          <div className="input-field">
            <label>Costo</label>
            <input type="number" step="0.01" value={form.costo_compra} onChange={e => setForm({...form, costo_compra: e.target.value})} required />
          </div>
        </div>

        <button type="submit" className="btn btn-success">Añadir a Revisión</button>
      </form>
    </aside>
  );
};

export default ManualForm;