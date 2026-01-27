import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Plus, Trash2, Percent, ArrowDownRight } from 'lucide-react';
import '../styles/SettingsManager.css';

const SettingsManager = ({ politicas, onRefresh }) => {
  const [nuevaPolitica, setNuevaPolitica] = useState({
    proveedor: '', categoria: '', descuento_porcentaje: '', categoria_padre: ''
  });

  const proveedoresExistentes = [...new Set(politicas.map(p => p.proveedor))];
  const categoriasPrincipales = politicas.filter(p => !p.categoria_padre).map(p => p.categoria);

  const agregarPolitica = async (e) => {
    e.preventDefault();
    if (!nuevaPolitica.proveedor || !nuevaPolitica.categoria) return;

    const { error } = await supabase.from('politicas_comerciales').insert([{
      ...nuevaPolitica,
      descuento_porcentaje: nuevaPolitica.descuento_porcentaje || 0
    }]);

    if (!error) {
      setNuevaPolitica({ proveedor: '', categoria: '', descuento_porcentaje: '', categoria_padre: '' });
      onRefresh();
    }
  };

  const eliminarPolitica = async (id) => {
    await supabase.from('politicas_comerciales').delete().eq('id', id);
    onRefresh();
  };

  return (
    <div className="settings-card">
      <h3 className="title" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Settings size={18} /> Configuración de Políticas
      </h3>
      
      <form onSubmit={agregarPolitica} className="settings-form">
        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px auto', gap: '8px', marginBottom: '10px' }}>
          <input 
            className="input-standard"
            list="list-prov" 
            placeholder="Proveedor" 
            value={nuevaPolitica.proveedor} 
            onChange={e => setNuevaPolitica({...nuevaPolitica, proveedor: e.target.value})} 
          />
          <input 
            className="input-standard"
            placeholder="Categoría" 
            value={nuevaPolitica.categoria} 
            onChange={e => setNuevaPolitica({...nuevaPolitica, categoria: e.target.value})} 
          />
          <div style={{ position: 'relative' }}>
            <input 
              className="input-standard"
              type="number" 
              placeholder="%" 
              value={nuevaPolitica.descuento_porcentaje} 
              onChange={e => setNuevaPolitica({...nuevaPolitica, descuento_porcentaje: e.target.value})} 
            />
          </div>
          <button type="submit" className="btn btn-success" style={{ padding: '8px' }}>
            <Plus size={20} />
          </button>
        </div>
        
        <div className="form-group">
          <label className="form-label">Dependencia (Opcional)</label>
          <select 
            className="input-standard"
            value={nuevaPolitica.categoria_padre} 
            onChange={e => setNuevaPolitica({...nuevaPolitica, categoria_padre: e.target.value})}
          >
            <option value="">Sin Categoría Padre</option>
            {categoriasPrincipales.map(c => <option key={c} value={c}>Heredar de: {c}</option>)}
          </select>
        </div>
        <datalist id="list-prov">{proveedoresExistentes.map(p => <option key={p} value={p} />)}</datalist>
      </form>

      <div className="table-mini" style={{ marginTop: '20px' }}>
        <table className="policy-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>
              <th style={{ padding: '8px' }}>Proveedor</th>
              <th style={{ padding: '8px' }}>Categoría</th>
              <th style={{ padding: '8px' }}>Desc.</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {politicas.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px' }}>{p.proveedor}</td>
                <td style={{ padding: '8px' }}>
                  {p.categoria_padre && <ArrowDownRight size={12} style={{ marginRight: '4px' }} />}
                  <span className={p.categoria_padre ? 'sub' : 'main'}>{p.categoria}</span>
                </td>
                <td style={{ padding: '8px' }}>
                  <span className={`badge ${p.descuento_porcentaje == 0 ? 'ghost' : 'active'}`}>
                    {p.descuento_porcentaje > 0 ? `-${p.descuento_porcentaje}%` : 'Heredado'}
                  </span>
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <button onClick={() => eliminarPolitica(p.id)} className="btn btn-danger" style={{ padding: '4px' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SettingsManager;