import axios from 'axios';
import { getBearerToken, clearAuthData, isTokenValid } from './auth';

// Criar uma instância do axios com configurações otimizadas
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_WPP_API_ENDPOINT,
  timeout: 30000, // 30 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar automaticamente o token Bearer
apiClient.interceptors.request.use(
  (config) => {
    // Verificar se o token é válido antes de fazer a requisição
    if (isTokenValid()) {
      const token = getBearerToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      // Token inválido ou expirado
      const publicRoutes = ['/api/v1/request-otp', '/api/v1/validate-otp'];
      const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));
      
      if (!isPublicRoute) {
        console.warn('Token inválido ou expirado para rota protegida:', config.url);
        clearAuthData();
        // Não rejeitar aqui, deixar o servidor responder com 401
      }
    }
    
    // Log da requisição em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros de autenticação
apiClient.interceptors.response.use(
  (response) => {
    // Log da resposta em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Log do erro
    if (import.meta.env.DEV) {
      console.log(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      console.warn('🔐 Token inválido ou expirado, redirecionando para login');
      clearAuthData();
      
      // Redirecionar para login apenas se não estivermos já nas páginas de autenticação
      const currentPath = window.location.pathname;
      const authPages = ['/login', '/validate-otp', '/register', '/register-validate-otp'];
      
      if (!authPages.includes(currentPath)) {
        // Usar setTimeout para evitar problemas com navegação durante requisições
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    } else if (error.response?.status === 403) {
      console.warn('🚫 Acesso negado para:', error.config?.url);
    } else if (error.response?.status >= 500) {
      console.error('🔥 Erro interno do servidor:', error.response?.data);
    } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.error('🌐 Erro de conexão com o servidor');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient };
