import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNumbers } from '../context/NumbersContext';
import { FaMobile, FaUserCog, FaPlus, FaTrash, FaTimes, FaCheck, FaUndo, FaPhoneAlt } from 'react-icons/fa';
import { apiClient } from '../utils/apiClient';

export default function ManageNumbers() {
  const { workers, admins, refreshNumbers } = useNumbers();
  const [tipoSelecionado, setTipoSelecionado] = useState('workers');
  const [novoNumero, setNovoNumero] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [removalLoading, setRemovalLoading] = useState({});
  const [erro, setErro] = useState('');
  const [animated, setAnimated] = useState(false);
  const WppApiEndpoint = import.meta.env.VITE_WPP_API_ENDPOINT;

  useEffect(() => {
    setAnimated(true);
  }, []);

  const handleAdicionar = async () => {
    setErro('');
    setSucesso('');

    if (!novoNumero) {
      setErro('Informe o número com DDD e DDI');
      return;
    }

    // Validação simples de formato (números apenas, comprimento apropriado)
    if (!/^\d+$/.test(novoNumero) || novoNumero.length < 10) {
      setErro('Formato inválido. Use apenas números com DDI+DDD+Número (Ex: 5511999999999)');
      return;
    }
    
    setLoading(true);
    try {
      await apiClient.post('/api/v2/numbers/add', { 
        number: novoNumero, 
        role: tipoSelecionado === 'workers' ? 'workers' : 'admins'
      });
      setSucesso(`Número ${novoNumero} adicionado com sucesso!`);
      setNovoNumero('');
      refreshNumbers();
    } catch (error) {
      console.error('Erro ao adicionar número:', error);
      setErro(error.response?.data?.description || 'Erro ao adicionar número. Verifique o formato e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemover = async (number) => {
    setErro('');
    setSucesso('');
    setRemovalLoading(prev => ({ ...prev, [number]: true }));
    
    try {
      await apiClient.delete('/api/v2/numbers', {
        data: { 
          number, 
          role: tipoSelecionado === 'workers' ? 'workers' : 'admins'
        }
      });
      setSucesso(`Número ${number} removido com sucesso!`);
      refreshNumbers();
    } catch (error) {
      console.error('Erro ao remover número:', error);
      setErro(`Erro ao remover ${number}: ${error.response?.data?.description || 'Falha na requisição'}`);
    } finally {
      setRemovalLoading(prev => ({ ...prev, [number]: false }));
    }
  };

  const limparMensagens = () => {
    setSucesso('');
    setErro('');
  };

  const lista = tipoSelecionado === 'workers' ? workers : admins;
  const isWorkers = tipoSelecionado === 'workers';

  return (
    <DashboardLayout>
      <div className={`transition-all duration-500 ${animated ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center mb-6">
          <div className={`bg-gradient-to-r ${isWorkers ? 'from-blue-500 to-indigo-600' : 'from-purple-500 to-pink-600'} w-12 h-12 rounded-lg flex items-center justify-center mr-4 shadow-lg`}>
            {isWorkers ? <FaMobile className="text-white text-xl" /> : <FaUserCog className="text-white text-xl" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gerenciar {isWorkers ? 'Dispositivos' : 'Administradores'}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
          <button
            onClick={() => {
              setTipoSelecionado('workers');
              limparMensagens();
            }}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center ${
              isWorkers
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaMobile className={`mr-2 ${isWorkers ? 'text-white' : 'text-blue-500'}`} />
            Dispositivos
          </button>
          <button
            onClick={() => {
              setTipoSelecionado('admins');
              limparMensagens();
            }}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center ${
              !isWorkers
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaUserCog className={`mr-2 ${!isWorkers ? 'text-white' : 'text-purple-500'}`} />
            Administradores
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário adicionar */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaPlus className={`mr-2 ${isWorkers ? 'text-blue-500' : 'text-purple-500'}`} />
              Adicionar {isWorkers ? 'Dispositivo' : 'Administrador'}
            </h2>
            
            {sucesso && (
              <div className="mb-4 flex items-center p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                <span className="flex-grow">{sucesso}</span>
                <button 
                  className="text-green-500 hover:text-green-700" 
                  onClick={() => setSucesso('')}
                  aria-label="Fechar"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            
            {erro && (
              <div className="mb-4 flex items-center p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <FaTimes className="text-red-500 mr-2 flex-shrink-0" />
                <span className="flex-grow">{erro}</span>
                <button 
                  className="text-red-500 hover:text-red-700" 
                  onClick={() => setErro('')}
                  aria-label="Fechar"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Novo número de {isWorkers ? 'WhatsApp' : 'administrador'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhoneAlt className={`${isWorkers ? 'text-blue-400' : 'text-purple-400'}`} />
                  </div>
                  <input
                    type="text"
                    value={novoNumero}
                    onChange={(e) => setNovoNumero(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Formato: 5511999999999"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Inclua o código do país (DDI) e DDD, sem espaços ou símbolos
                </p>
              </div>
              
              <button
                onClick={handleAdicionar}
                disabled={loading}
                className={`w-full flex items-center justify-center px-5 py-3 rounded-lg font-medium transition-all shadow-md text-white ${
                  isWorkers 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                } ${loading ? 'opacity-70' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    <span>Adicionando...</span>
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2" />
                    <span>Adicionar Número</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Lista de números */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow h-fit">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              {isWorkers ? (
                <>
                  <FaMobile className="mr-2 text-blue-500" />
                  Dispositivos WhatsApp
                </>
              ) : (
                <>
                  <FaUserCog className="mr-2 text-purple-500" />
                  Administradores
                </>
              )}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({lista.length})
              </span>
            </h2>
            
            {lista.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isWorkers ? 'bg-blue-100 text-blue-500' : 'bg-purple-100 text-purple-500'
                } mb-4`}>
                  {isWorkers ? <FaMobile className="text-2xl" /> : <FaUserCog className="text-2xl" />}
                </div>
                <p className="text-gray-500 mb-2">Nenhum {isWorkers ? 'dispositivo' : 'administrador'} cadastrado</p>
                <p className="text-sm text-gray-400">Adicione um novo número usando o formulário</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <ul className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                  {lista.map((numero, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isWorkers ? 'bg-blue-100 text-blue-500' : 'bg-purple-100 text-purple-500'
                        } mr-3`}>
                          {isWorkers ? <FaPhoneAlt /> : <FaUserCog />}
                        </div>
                        <span className="font-medium text-gray-800">{numero}</span>
                      </div>
                      <button
                        onClick={() => handleRemover(numero)}
                        disabled={removalLoading[numero]}
                        className={`ml-2 flex items-center px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                          removalLoading[numero] 
                            ? 'bg-gray-100 text-gray-400' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        {removalLoading[numero] ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent mr-1"></div>
                        ) : (
                          <FaTrash className="mr-1" />
                        )}
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {lista.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={refreshNumbers}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                >
                  <FaUndo className="mr-1" />
                  Atualizar lista
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
