import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock } from 'lucide-react'; // Opcional: para darle un toque visual
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="manual-card login-container">
        <div className="login-header">
          <Lock size={32} className="icon-blue" />
          <h2>Inventory Hub</h2>
          <p className="form-label">Ingresa tus credenciales</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-field">
            <label className="form-label">Email</label>
            <input 
              className="input-standard"
              type="email" 
              placeholder="correo@ejemplo.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-field">
            <label className="form-label">Contraseña</label>
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
            className="btn btn-success" 
            style={{ width: '100%', marginTop: '10px' }} 
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;