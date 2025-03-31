import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const NumbersContext = createContext();

export const NumbersProvider = ({ children }) => {
  const [numbers, setNumbers] = useState({ workers: [], admins: [] });
  const [loading, setLoading] = useState(true); // true por padrão
  const [erro, setErro] = useState('');

  const fetchNumbers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErro('Token não encontrado');
        return;
      }
      const res = await axios.get('https://api.synergyrpa.com/api/v1/numbers', {
        headers: { token },
      });
      setNumbers(res.data.description);
    } catch {
      setErro('Erro ao carregar números');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNumbers();
  }, []);

  return (
    <NumbersContext.Provider
      value={{
        workers: numbers.workers,
        admins: numbers.admins,
        loading,
        erro,
        refreshNumbers: fetchNumbers,
      }}
    >
      {!loading ? children : <div className="text-center p-10 text-gray-600">Carregando números...</div>}
    </NumbersContext.Provider>
  );
};

export const useNumbers = () => useContext(NumbersContext);
