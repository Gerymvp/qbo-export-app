import React from 'react';
import { useLogin } from './useLogin';
import LoginView from './LoginView';

const Login = () => {
  const loginProps = useLogin();

  return <LoginView {...loginProps} />;
};

export default Login;