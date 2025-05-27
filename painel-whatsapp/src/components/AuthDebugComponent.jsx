import React, { useEffect, useState } from 'react';
import { useNumbers } from '../context/NumbersContext';

const AuthDebugComponent = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const { workers, loading, erro } = useNumbers();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('wpp_bearer_token');
      const expiresAt = localStorage.getItem('wpp_token_expires_at');
      const userEmail = localStorage.getItem('wpp_user_email');
      
      const status = {
        hasToken: !!token,
        hasExpiry: !!expiresAt,
        hasEmail: !!userEmail,
        token: token ? `${token.slice(0, 10)}...` : null,
        expiresAt: expiresAt ? new Date(parseInt(expiresAt)).toLocaleString() : null,
        userEmail,
        isValid: false
      };

      if (token && expiresAt) {
        const expirationTime = parseInt(expiresAt);
        const currentTime = Date.now();
        status.isValid = currentTime < expirationTime;
        status.timeRemaining = Math.floor((expirationTime - currentTime) / 1000 / 60);
      }

      setAuthStatus(status);
    };

    checkAuth();
    const interval = setInterval(checkAuth, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-md z-50">
      <h3 className="font-bold text-lg mb-2">🔍 Debug de Autenticação</h3>
      
      <div className="space-y-2 text-sm">
        <div className="border-b pb-2">
          <h4 className="font-semibold">Dados de Autenticação:</h4>
          <p>Token: <span className={authStatus?.hasToken ? 'text-green-600' : 'text-red-600'}>
            {authStatus?.hasToken ? '✓ Presente' : '✗ Ausente'}
          </span></p>
          <p>Expiração: <span className={authStatus?.hasExpiry ? 'text-green-600' : 'text-red-600'}>
            {authStatus?.hasExpiry ? '✓ Presente' : '✗ Ausente'}
          </span></p>
          <p>Email: <span className={authStatus?.hasEmail ? 'text-green-600' : 'text-red-600'}>
            {authStatus?.hasEmail ? '✓ Presente' : '✗ Ausente'}
          </span></p>
          <p>Válido: <span className={authStatus?.isValid ? 'text-green-600' : 'text-red-600'}>
            {authStatus?.isValid ? '✓ Sim' : '✗ Não'}
          </span></p>
          {authStatus?.timeRemaining && (
            <p>Tempo restante: {authStatus.timeRemaining} min</p>
          )}
        </div>

        <div className="border-b pb-2">
          <h4 className="font-semibold">NumbersContext:</h4>
          <p>Loading: <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
            {loading ? 'Sim' : 'Não'}
          </span></p>
          <p>Workers: <span className={workers?.length > 0 ? 'text-green-600' : 'text-red-600'}>
            {workers?.length || 0} encontrados
          </span></p>
          <p>Erro: <span className={erro ? 'text-red-600' : 'text-green-600'}>
            {erro || 'Nenhum'}
          </span></p>
        </div>

        <div>
          <h4 className="font-semibold">Variáveis de Ambiente:</h4>
          <p>API Endpoint: {import.meta.env.VITE_WPP_API_ENDPOINT || 'Não definido'}</p>
        </div>
      </div>

      <button 
        onClick={() => {
          console.clear();
          console.log('=== DEBUG COMPLETO ===');
          console.log('Auth Status:', authStatus);
          console.log('Workers:', workers);
          console.log('Loading:', loading);
          console.log('Erro:', erro);
          console.log('LocalStorage completo:');
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`${key}:`, localStorage.getItem(key));
          }
        }}
        className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs w-full"
      >
        Log Debug Completo
      </button>
    </div>
  );
};

export default AuthDebugComponent;
