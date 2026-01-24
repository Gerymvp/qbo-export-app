import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Plus, Trash2, Percent, ArrowDownRight } from 'lucide-react';

const SettingsManager = ({ politicas, onRefresh }) => {
  const [nuevaPolitica, setNuevaPolitica] = useState({
    proveedor: '',
    categoria: '',
    descuento_porcentaje: '',
    categoria_padre: ''
  });

  const proveedoresExistentes = [...new Set(politicas.map(p => p.proveedor))];
  const categoriasPrincipales = politicas.filter(p => !p.categoria_padre).map(p => p.categoria);

  const agregarPolitica = async (e) => {
    e.preventDefault();
    if (!nuevaPolitica.proveedor || !nuevaPolitica.categoria) return;

    // Si no se pone descuento, se asume 0 para heredar del padre
    const datosEnvio = {
      ...nuevaPolitica,
      descuento_porcentaje: nuevaPolitica.descuento_porcentaje || 0
    };

    const { error } = await supabase.from('politicas_comerciales').insert([datosEnvio]);
    if (!error) {
      setNuevaPolitica({ proveedor: '', categoria: '', descuento_porcentaje: '', categoria_padre: '' });
      onRefresh();
    } else {
      alert("Error al guardar: " + error.message);
    }
  };

  const eliminarPolitica = async (id) => {
    await supabase.from('politicas_comerciales').delete().eq('id', id);
    onRefresh();
  };

  return (
    <div className="card settings-manager">
      <h3 className="title"><Settings size={18} /> Configuración de Políticas y Herencia</h3>
      
      <form onSubmit={agregarPolitica} className="vertical-form" style={{ gap: '8px', marginBottom: '15px' }}>
        <div className="inline-form" style={{ gridTemplateColumns: '1fr 1fr 80px 40px' }}>
          <input 
            list="list-prov-settings"
            placeholder="Proveedor" 
            value={nuevaPolitica.proveedor}
            onChange={e => setNuevaPolitica({...nuevaPolitica, proveedor: e.target.value})}
          />
          <input 
            placeholder="Nombre Categoría" 
            value={nuevaPolitica.categoria}
            onChange={e => setNuevaPolitica({...nuevaPolitica, categoria: e.target.value})}
          />
          <div className="input-with-icon">
            <input 
              type="number" placeholder="%" 
              value={nuevaPolitica.descuento_porcentaje}
              onChange={e => setNuevaPolitica({...nuevaPolitica, descuento_porcentaje: e.target.value})}
            />
            <Percent size={14} className="icon-inside" />
          </div>
          <button type="submit" className="btn-add-setting"><Plus size={16} /></button>
        </div>
        
        <select 
          className="select-parent"
          value={nuevaPolitica.categoria_padre}
          onChange={e => setNuevaPolitica({...nuevaPolitica, categoria_padre: e.target.value})}
        >
          <option value="">Es Categoría Principal (No hereda)</option>
          {categoriasPrincipales.map(c => (
            <option key={c} value={c}>Heredar de: {c}</option>
          ))}
        </select>
        <datalist id="list-prov-settings">
          {proveedoresExistentes.map(p => <option key={p} value={p} />)}
        </datalist>
      </form>

      <div className="table-container-mini">
        <table className="policy-list">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Categoría / Sub</th>
              <th>Desc.</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {politicas.map(p => (
              <tr key={p.id}>
                <td>{p.proveedor}</td>
                <td>
                  {p.categoria_padre ? (
                    <span className="sub-cat-label">
                      <ArrowDownRight size={12} /> {p.categoria}
                    </span>
                  ) : (
                    <strong>{p.categoria}</strong>
                  )}
                </td>
                <td>
                  <span className={`badge-discount ${p.descuento_porcentaje == 0 ? 'zero' : ''}`}>
                    {p.descuento_porcentaje > 0 ? `-${p.descuento_porcentaje}%` : 'Heredado'}
                  </span>
                </td>
                <td>
                  <button onClick={() => eliminarPolitica(p.id)} className="btn-delete-small">
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