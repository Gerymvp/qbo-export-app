import React from 'react';
import { LogOut, Link as LinkIcon, RefreshCw } from 'lucide-react';

const F_Header = ({ isConnected, realmId, onConnect, onLogout, onRefresh }) => (
  <header className="facturacion-header-dashboard">
    <div>
      <h2>Gestor de Facturas</h2>
      <span className={`status-pill ${isConnected ? 'active' : 'inactive'}`}>
        {isConnected ? `🟢 Empresa: ${realmId}` : "🔴 QuickBooks Desconectado"}
      </span>
    </div>
    <div style={{ display: 'flex', gap: '10px' }}>
      {isConnected ? (
        <button className="btn btn-danger" onClick={onLogout}><LogOut size={16} /> Cerrar Sesión</button>
      ) : (
        <button className="btn btn-primary" onClick={onConnect}><LinkIcon size={16} /> Conectar QuickBooks</button>
      )}
      <button className="btn btn-primary" onClick={onRefresh}><RefreshCw size={16} /></button>
    </div>
  </header>
);

export default F_Header;