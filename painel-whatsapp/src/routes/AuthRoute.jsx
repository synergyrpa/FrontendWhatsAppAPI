import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Componente para proteger rotas que requerem autenticação
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente filho a ser renderizado se autenticado
 * @param {string} [props.redirectTo="/login"] - Caminho para redirecionamento se não autenticado
 * @returns {React.ReactNode} O componente filho ou um redirecionamento
 */
const AuthRoute = ({ children, redirectTo = "/login" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  
  // Usando React useEffect para verificar autenticação durante a montagem do componente
  useEffect(() => {
    // Verificar token de forma direta
    const token = localStorage.getItem('wpp_bearer_token');
    
    if (!token) {
      console.log('Token não encontrado no localStorage');
      setIsAuth(false);
      setIsLoading(false);
      return;
    }
    
    // Se temos token, vamos verificar se ainda é válido
    try {
      const expiresAt = localStorage.getItem('wpp_token_expires_at');
      if (!expiresAt) {
        console.log('Data de expiração não encontrada');
        setIsAuth(false);
        setIsLoading(false);
        return;
      }
      
      const expirationTime = parseInt(expiresAt);
      const currentTime = Date.now();
      
      // Token é válido se o tempo atual for MENOR que o tempo de expiração
      const valid = currentTime < expirationTime;
      
      console.log('Verificação de autenticação:', { 
        valid, 
        expiresAt: new Date(expirationTime).toLocaleString(),
        currentTime: new Date(currentTime).toLocaleString(),
        tempoRestante: Math.floor((expirationTime - currentTime) / 1000 / 60) + " minutos"
      });
      
      setIsAuth(valid);
      setIsLoading(false);
      
      if (!valid) {
        console.log('Token expirado, limpando dados...');
        localStorage.removeItem('wpp_bearer_token');
        localStorage.removeItem('wpp_token_expires_at');
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuth(false);
      setIsLoading(false);
    }
  }, []);
  
  // Ouvir evento de expiração de token
  useEffect(() => {
    const handleAuthExpired = () => {
      console.log('Evento de expiração de autenticação recebido');
      setIsAuth(false);
    };
    
    window.addEventListener('authExpired', handleAuthExpired);
    return () => {
      window.removeEventListener('authExpired', handleAuthExpired);
    };
  }, []);

  // Exibir indicador de carregamento enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para o login
  if (!isAuth) {
    console.log('Usuário não autenticado, redirecionando para:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // Se estiver autenticado, renderiza o conteúdo protegido
  console.log('Usuário autenticado com sucesso, renderizando conteúdo protegido');
  return children;
};

export default AuthRoute;
