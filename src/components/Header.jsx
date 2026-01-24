import React from 'react';
import { Database, CheckCircle } from 'lucide-react';

const Header = ({ onUpload }) => {
  return (
    <header className="header-container">
      <div className="logo-section">
        <Database size={28} color="#2ca01c" />
        <h1>Inventory Hub QBO</h1>
      </div>
      <button onClick={onUpload} className="btn-upload">
        <CheckCircle size={18} /> Sincronizar con Supabase
      </button>
    </header>
  );
};

export default Header;