/**
 * Utilitários para gerenciamento de autenticação
 * Sistema seguro de armazenamento e gestão de tokens Bearer
 */

// Chaves para armazenamento
const STORAGE_KEYS = {
  BEARER_TOKEN: 'wpp_bearer_token',
  TOKEN_EXPIRES_AT: 'wpp_token_expires_at',
  USER_EMAIL: 'wpp_user_email',
  REFRESH_BUFFER: 0 // Removido buffer para evitar problemas com expiração prematura
};

// Verificar se o token ainda é válido
export const isTokenValid = () => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.BEARER_TOKEN);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    
    if (!token || !expiresAt) {
      console.log("Token não encontrado no localStorage:", { token: !!token, expiresAt: !!expiresAt });
      return false;
    }
    
    // Verifica se o token já expirou (sem considerar o buffer)
    const expirationTime = parseInt(expiresAt);
    const currentTime = Date.now();
    
    // Para evitar saídas inesperadas, verificamos apenas se o token realmente expirou
    const isValid = currentTime < expirationTime;
    console.log("Status do token:", { 
      isValid, 
      expiresAt: new Date(expirationTime).toLocaleString(),
      currentTime: new Date(currentTime).toLocaleString(),
      tempoRestante: Math.floor((expirationTime - currentTime) / 1000 / 60) + " minutos"
    });
    
    return isValid;
  } catch (error) {
    console.error("Erro ao verificar validade do token:", error);
    return false;
  }
};

// Obter token Bearer válido
export const getBearerToken = () => {
  if (isTokenValid()) {
    return localStorage.getItem(STORAGE_KEYS.BEARER_TOKEN);
  }
  return null;
};

// Armazenar dados de autenticação de forma segura
export const setAuthData = (token, expiresIn) => {
  if (!token || !expiresIn) {
    console.error('Token ou tempo de expiração inválido', { token: !!token, expiresIn });
    return false;
  }
  
  // Calcular timestamp de expiração
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  try {
    // Limpar dados antigos primeiro
    localStorage.removeItem(STORAGE_KEYS.BEARER_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    
    // Armazenar novos dados
    localStorage.setItem(STORAGE_KEYS.BEARER_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString());
    
    // Verificar se foi armazenado corretamente
    const storedToken = localStorage.getItem(STORAGE_KEYS.BEARER_TOKEN);
    const storedExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    
    const success = !!storedToken && !!storedExpiry;
    console.log('Token armazenado com sucesso:', success);
    console.log('Expira em:', new Date(expiresAt).toLocaleString());
    
    return success;
  } catch (error) {
    console.error('Erro ao armazenar token:', error);
    return false;
  }
};

// Limpar dados de autenticação
export const clearAuthData = () => {
  const keysToRemove = [
    STORAGE_KEYS.BEARER_TOKEN,
    STORAGE_KEYS.TOKEN_EXPIRES_AT,
    STORAGE_KEYS.USER_EMAIL,
    'pendingEmail',
    'pendingPhone',
    'token' // Remove token temporário se existir
  ];
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Erro ao remover ${key}:`, error);
    }
  });
  
  console.log('Dados de autenticação removidos');
};

// Obter cabeçalhos de autorização
export const getAuthHeaders = () => {
  const token = getBearerToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

// Verificar se usuário está autenticado
export const isAuthenticated = () => {
  const authenticated = isTokenValid();
  console.log('isAuthenticated check result:', authenticated);
  return authenticated;
};

// Obter informações do usuário armazenadas
export const getUserEmail = () => {
  return localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
};

// Armazenar email do usuário
export const setUserEmail = (email) => {
  if (email) {
    localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
  }
};

// Obter informações do token (sem decodificar por segurança)
export const getTokenInfo = () => {
  const token = getBearerToken();
  const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  
  if (!token || !expiresAt) {
    return null;
  }
  
  return {
    hasToken: true,
    expiresAt: new Date(parseInt(expiresAt)),
    isValid: isTokenValid(),
    timeUntilExpiry: parseInt(expiresAt) - Date.now()
  };
};

// Verificar se o token está próximo de expirar
export const isTokenNearExpiry = () => {
  const tokenInfo = getTokenInfo();
  if (!tokenInfo) return true;
  
  const fiveMinutes = 5 * 60 * 1000; // 5 minutos em ms
  return tokenInfo.timeUntilExpiry < fiveMinutes;
};
