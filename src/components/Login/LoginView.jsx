import React from 'react';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import '../../styles/Login.css';

const LoginView = ({ 
  email, setEmail, 
  password, setPassword, 
  loading, errorMsg, 
  handleLogin 
}) => {
  return (
    <div className="login-screen">
      <div className="manual-card login-container">
        <div className="login-header">
          <div className="icon-circle">
            <Lock size={32} className="icon-blue" />
          </div>
          <h2>Inventory Hub</h2>
          <p>Acceso Protegido</p>
        </div>

        {errorMsg && (
          <div className="error-message">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-field">
            <label>Correo Electrónico</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                className="input-standard"
                type="email" 
                placeholder="usuario@empresa.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="input-field">
            <label>Contraseña</label>
            <input 
              className="input-standard"
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full" 
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="spinner" size={18} /> Verificando...</>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;