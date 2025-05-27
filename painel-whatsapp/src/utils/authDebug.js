/**
 * Utilitário para depurar problemas de autenticação
 */

// Função para verificar dados de OTP pendentes
export const printOTPStatus = () => {
  try {
    const pendingEmail = localStorage.getItem('pendingEmail');
    const pendingPhone = localStorage.getItem('pendingPhone');
    
    console.group('📨 Status dos dados OTP');
    console.log('Email pendente:', pendingEmail);
    console.log('Telefone pendente:', pendingPhone);
    console.log('Tem email:', !!pendingEmail);
    console.log('Tem telefone:', !!pendingPhone);
    console.groupEnd();
    
    return { pendingEmail, pendingPhone };
  } catch (error) {
    console.error('Erro ao verificar status OTP:', error);
    return { pendingEmail: null, pendingPhone: null };
  }
};

// Função para imprimir informações sobre o estado atual da autenticação
export const printAuthStatus = () => {
  try {
    const token = localStorage.getItem('wpp_bearer_token');
    const expiresAt = localStorage.getItem('wpp_token_expires_at');
    
    console.group('📊 Status da Autenticação');
    console.log('Token presente:', !!token);
    
    if (expiresAt) {
      const expirationTime = parseInt(expiresAt);
      const currentTime = Date.now();
      const isValid = currentTime < expirationTime;
      const timeRemaining = Math.floor((expirationTime - currentTime) / 1000 / 60);
      
      console.log('Token válido:', isValid);
      console.log('Expira em:', new Date(expirationTime).toLocaleString());
      console.log('Tempo restante:', timeRemaining, 'minutos');
    } else {
      console.log('Dados de expiração não encontrados');
    }
    console.groupEnd();
    
    return !!token && !!expiresAt;
  } catch (error) {
    console.error('Erro ao verificar status de autenticação:', error);
    return false;
  }
};

// Função para forçar limpeza dos dados de autenticação
export const forceLogout = () => {
  try {
    localStorage.removeItem('wpp_bearer_token');
    localStorage.removeItem('wpp_token_expires_at');
    localStorage.removeItem('wpp_user_email');
    console.log('🧹 Dados de autenticação removidos com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao limpar dados de autenticação:', error);
    return false;
  }
};

// Função para reparar o token (para debug/testes)
export const repairToken = (token, expiresInMinutes = 60) => {
  try {
    if (!token) {
      console.error('Token não fornecido');
      return false;
    }
    
    const expiresAt = Date.now() + (expiresInMinutes * 60 * 1000);
    
    localStorage.setItem('wpp_bearer_token', token);
    localStorage.setItem('wpp_token_expires_at', expiresAt.toString());
    
    console.log('🔧 Token reparado com sucesso. Expira em:', new Date(expiresAt).toLocaleString());
    return true;
  } catch (error) {
    console.error('Erro ao reparar token:', error);
    return false;
  }
};

// Função para debug completo
export const fullAuthDebug = () => {
  console.group('🔧 Debug Completo da Autenticação');
  
  // Status dos dados OTP
  printOTPStatus();
  
  // Status da autenticação
  printAuthStatus();
  
  // Todos os dados do localStorage
  console.group('💾 Todos os dados do localStorage');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value);
  }
  console.groupEnd();
  
  console.groupEnd();
};

// Expor função globalmente para facilitar debug
if (typeof window !== 'undefined') {
  window.authDebug = {
    printAuthStatus,
    printOTPStatus,
    forceLogout,
    repairToken,
    fullAuthDebug
  };
  console.log('🔧 Funções de debug disponíveis globalmente em window.authDebug');
}
