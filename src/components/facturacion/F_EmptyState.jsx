import React from 'react';
import { UploadCloud } from 'lucide-react';

const F_EmptyState = ({ onFileUpload }) => (
  <div className="empty-state-card">
    <UploadCloud size={48} color="#cbd5e1" />
    <h3>Cargar Factura</h3>
    <p>Selecciona un XML de tu equipo o revisa la bandeja de entrada.</p>
    <label className="btn btn-success" style={{ marginTop: '20px', cursor: 'pointer' }}>
      Subir XML Local
      <input type="file" accept=".xml" onChange={onFileUpload} style={{ display: 'none' }} />
    </label>
  </div>
);

export default F_EmptyState;