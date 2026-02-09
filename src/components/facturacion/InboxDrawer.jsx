import React from 'react';
import { Mail, X, ChevronRight, Clock, Trash2 } from 'lucide-react'; // Importamos Trash2
import '../../styles/Facturacion/InboxDrawer.css';

const InboxDrawer = ({ isOpen, onClose, pendientes, onSelect, onDelete }) => {
  return (
    <>
      {isOpen && <div className="drawer-overlay" onClick={onClose} />}
      
      <aside className={`inbox-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="header-title">
            <Mail size={20} className="mail-icon" />
            <span>Bandeja de Entrada</span>
            {pendientes.length > 0 && <span className="drawer-badge">{pendientes.length}</span>}
          </div>
          <button className="close-drawer-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="drawer-content">
          <div className="drawer-info">
            <small>Facturas enviadas por Fernando Velasquez</small>
          </div>
          
          <div className="inbox-scroll-area">
            {pendientes.length === 0 ? (
              <div className="empty-drawer">
                <Mail size={40} strokeWidth={1} />
                <p>No hay facturas pendientes</p>
              </div>
            ) : (
              pendientes.map((f) => (
                <div key={f.id} className="drawer-item" onClick={() => { onSelect(f); onClose(); }}>
                  <div className="item-main">
                    <div className="provider-info">
                       <span className="item-provider">{f.proveedor || "XML Recibido"}</span>
                    </div>
                      // En InboxDrawer.jsx, dentro del map de pendientes:
                      <div className="item-actions">
                        <button 
                          className="btn btn-danger" // Cambiado de btn-danger-soft a btn-danger para usar btn.css
                          onClick={(e) => {
                            e.stopPropagation(); 
                            if(window.confirm('¿Eliminar esta factura?')) onDelete(f.id); //
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                        <ChevronRight size={16} className="arrow-icon" />
                      </div>
                  </div>
                  <div className="item-meta">
                    <Clock size={12} />
                    <span>{new Date(f.fecha_recepcion).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default InboxDrawer;