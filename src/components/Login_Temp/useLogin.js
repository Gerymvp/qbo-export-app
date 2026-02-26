import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export const useLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      // 1. Limpiamos sesión previa
      await supabase.auth.signOut();

      // 2. Intentamos el login
      const { error } = await supabase.auth.signInWithPassword({
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

  return {
    email, setEmail,
    password, setPassword,
    loading, errorMsg,
    handleLogin
  };
};