import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      // 1. Limpiamos cualquier rastro de sesión previa
      await supabase.auth.signOut();

      // 2. Intentamos el login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

    } catch (error) {
      console.error('Error de autenticación:', error.message);
      setErrorMsg('Credenciales inválidas. Por favor, revisa tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

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

export default Login;