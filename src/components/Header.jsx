import React from 'react';
import { Database, CheckCircle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import '../styles/Header.css';
import '../styles/btn.css'; 

const Header = ({ onUpload }) => {
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
    }
  };

  return (
    <header className="main-header">
      <div className="logo-section">
        <Database size={24} />
        <h1>Inventory Hub QBO</h1>
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        {/* Botón Sincronizar: Usa la clase btn-success de tu sistema global */}
        <button onClick={onUpload} className="btn btn-success">
          <CheckCircle size={18} /> Sincronizar con Supabase
        </button>

        {/* Botón Salir: Usa la clase btn-danger de tu sistema global */}
        <button onClick={handleLogout} className="btn btn-danger">
          <LogOut size={18} /> Salir
        </button>
      </div>
    </header>
  );
};

export default Header;