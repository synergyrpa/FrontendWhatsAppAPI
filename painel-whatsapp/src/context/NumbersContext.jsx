import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { isAuthenticated } from '../utils/auth';

const NumbersContext = createContext();

export const NumbersProvider = ({ children }) => {
  const [numbers, setNumbers] = useState({ workers: [], admins: [] });
  const [loading, setLoading] = useState(true); // true por padrão
  const [erro, setErro] = useState('');
  
  const fetchNumbers = async () => {
    console.log("NumbersContext fetchNumbers running, isAuthenticated:", isAuthenticated());
    if (!isAuthenticated()) {
      console.log("Usuário não autenticado, não carregando números");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(''); // Limpar erro anterior
    try {
      console.log("Fazendo requisição para /api/v1/numbers");
      const res = await apiClient.get('/api/v1/numbers');
      console.log("Resposta da API /api/v1/numbers:", res.data);
      
      if (res.data && res.data.description) {
        setNumbers(res.data.description);
        console.log("Numbers atualizados:", res.data.description);
      } else {
        console.warn("Resposta da API não contém description:", res.data);
        setNumbers({ workers: [], admins: [] });
      }
      setErro('');
    } catch (error) {
      console.error('Erro ao carregar números:', error);
      setErro('Erro ao carregar números: ' + (error.response?.data?.message || error.message));
      setNumbers({ workers: [], admins: [] }); // Reset para estado vazio
      
      if (error.response?.status === 401) {
        console.log("Token expirado, será tratado pelo interceptor");
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("NumbersContext useEffect running");
    fetchNumbers();
  }, []);

  return (
    <NumbersContext.Provider
      value={{
        workers: numbers.workers || [],
        admins: numbers.admins || [],
        loading,
        erro,
        refreshNumbers: fetchNumbers,
      }}
    >
      {children}
    </NumbersContext.Provider>
  );
};

export const useNumbers = () => useContext(NumbersContext);
