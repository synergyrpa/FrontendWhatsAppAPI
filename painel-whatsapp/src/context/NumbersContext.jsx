import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const NumbersContext = createContext();

export const NumbersProvider = ({ children }) => {
  const [numbers, setNumbers] = useState({ workers: [], admins: [] });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const fetchNumbers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
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
        refreshNumbers: fetchNumbers, // 👈 aqui!
      }}
    >
      {children}
    </NumbersContext.Provider>
  );
};

export const useNumbers = () => useContext(NumbersContext);
