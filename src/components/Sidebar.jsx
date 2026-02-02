import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  LogOut, 
  ChevronLeft, 
  Menu, 
  Database, 
  Calculator 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import '../styles/Sidebar/sidebar.css';

const Sidebar = ({ isCollapsed, setIsCollapsed, currentView, setCurrentView }) => {
  // Estado para bloquear el hover momentáneamente al cerrar
  const [isClosing, setIsClosing] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard QBO', icon: <LayoutDashboard size={22} strokeWidth={1.5} /> },
    { id: 'inventario', label: 'Inventario Pro', icon: <Package size={22} strokeWidth={1.5} /> },
    { id: 'facturacion', label: 'Facturación', icon: <Calculator size={22} strokeWidth={1.5} /> },
  ];

  // Función mejorada para cerrar el sidebar
  const handleClose = () => {
    setIsClosing(true); // Activa la clase que anula el pointer-events
    setIsCollapsed(true); // Cambia el estado a colapsado
    
    // Quitamos el bloqueo después de que termine la animación de CSS (300ms)
    setTimeout(() => {
      setIsClosing(false);
    }, 400); 
  };

  return (
    <>
      {/* Botón flotante: Solo se ve si está colapsado Y no se está cerrando en este instante */}
      {isCollapsed && !isClosing && (
        <button 
          className="toggle-btn-floating" 
          onClick={() => setIsCollapsed(false)}
        >
          <Menu size={24} />
        </button>
      )}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isClosing ? 'is-closing' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Database size={24} />
            <span>QBO Export</span>
          </div>
          {/* Botón de cierre con la nueva lógica */}
          <button className="close-sidebar-btn" onClick={handleClose}>
            <ChevronLeft size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div 
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentView(item.id);
                // Si quieres que se cierre solo al elegir una opción, descomenta la siguiente línea:
                // handleClose(); 
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item logout-btn" onClick={() => supabase.auth.signOut()}>
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;