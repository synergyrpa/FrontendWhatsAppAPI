import { useEffect, useState } from 'react';
import apiClient from '../utils/apiClient';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNumbers } from '../context/NumbersContext';
import { FaWifi, FaSync, FaMobile, FaCircle, FaExclamationTriangle, FaClock, FaPhoneAlt } from 'react-icons/fa';

export default function StatusPage() {
  const { workers } = useNumbers();
  const [statusData, setStatusData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState('');
  const [animated, setAnimated] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const newStatus = {};
      
      console.log('📊 StatusPage: Buscando status para números:', workers);
      
      await Promise.all(
        workers.map(async (number) => {
          try {
            const res = await apiClient.get('/api/v1/number-status', {
              params: { number }
            });
            
            newStatus[number] = {
              status: res.data.description?.status || 'desconhecido',
              qrCode: res.data.description?.qrCode,
              time: new Date().toLocaleString('pt-BR'),
            };
          } catch (err) {
            newStatus[number] = {
              status: 'erro',
              error: err.message,
              time: new Date().toLocaleString('pt-BR'),
            };
          }
        })
      );

      setStatusData(newStatus);
      setLastUpdate(new Date());
      setError('');
    } catch (err) {
      console.error('Erro ao obter status:', err);
      setError('Falha ao buscar status dos dispositivos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAnimated(true);
    if (workers.length === 0) return;
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // atualiza a cada 30s
    
    return () => clearInterval(interval);
  }, [workers]);

  // Cálculos de estatísticas
  const calculateStats = () => {
    if (!workers.length) return { connected: 0, disconnected: 0, error: 0, total: 0, connectedPercent: 0 };
    
    const connected = Object.values(statusData).filter(data => data?.status === 'conectado').length;
    const disconnected = Object.values(statusData).filter(data => data?.status === 'desconectado').length;
    const errorCount = Object.values(statusData).filter(data => data?.status === 'erro').length;
    const total = workers.length;
    const connectedPercent = Math.round((connected / total) * 100);
    
    return { connected, disconnected, error: errorCount, total, connectedPercent };
  };
  
  const stats = calculateStats();
  
  // Formatar tempo decorrido desde a última atualização
  const getTimeAgo = () => {
    if (!lastUpdate) return '';
    
    const diffMs = Date.now() - lastUpdate.getTime();
    const diffSec = Math.round(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec} segundos atrás`;
    
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin} minutos atrás`;
  };

  return (
    <DashboardLayout>
      <div className={`transition-all duration-500 ${animated ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 shadow-lg">
            <FaWifi className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Status dos Dispositivos</h1>
            <p className="text-gray-500 text-sm flex items-center mt-1">
              <FaClock className="mr-1" /> Última atualização: {lastUpdate ? getTimeAgo() : 'Nunca'}
            </p>
          </div>
          
          <button 
            onClick={fetchStatus} 
            disabled={loading}
            className="ml-auto bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors flex items-center text-gray-700"
          >
            <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 mb-6 flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Total</h2>
              <div className="bg-blue-100 p-2 rounded-lg">
                <FaMobile className="text-blue-600 text-xl" />
              </div>
            </div>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-gray-800">{stats.total}</span>
              <span className="text-sm text-gray-500 ml-2 mb-1">dispositivos</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Conectados</h2>
              <div className="bg-green-100 p-2 rounded-lg">
                <FaCircle className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-gray-800">{stats.connected}</span>
              <span className="text-sm text-green-600 ml-2 mb-1">{stats.connectedPercent}%</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Desconectados</h2>
              <div className="bg-red-100 p-2 rounded-lg">
                <FaCircle className="text-red-600 text-xl" />
              </div>
            </div>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-gray-800">{stats.disconnected}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Erros</h2>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <FaExclamationTriangle className="text-yellow-600 text-xl" />
              </div>
            </div>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-gray-800">{stats.error}</span>
            </div>
          </div>
        </div>
        
        {/* Tabela de status */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center">
              <FaPhoneAlt className="mr-2 text-blue-500" />
              Dispositivos WhatsApp
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Número</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Última Verificação</th>
                  <th className="px-6 py-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      Nenhum dispositivo cadastrado
                    </td>
                  </tr>
                ) : (
                  workers.map((number) => {
                    const data = statusData[number];
                    return (
                      <tr key={number} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">{number}</td>
                        <td className="px-6 py-4">
                          {!data && (
                            <div className="flex items-center">
                              <div className="animate-pulse h-4 w-4 bg-gray-200 rounded-full mr-2"></div>
                              <span className="text-gray-500">Carregando...</span>
                            </div>
                          )}
                          {data?.status === 'conectado' && (
                            <div className="flex items-center">
                              <span className="flex h-3 w-3 relative mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                              </span>
                              <span className="text-green-600 font-medium">Conectado</span>
                            </div>
                          )}
                          {data?.status === 'desconectado' && (
                            <div className="flex items-center">
                              <span className="h-3 w-3 bg-red-500 rounded-full mr-2"></span>
                              <span className="text-red-600 font-medium">Desconectado</span>
                            </div>
                          )}
                          {data?.status === 'erro' && (
                            <div className="flex items-center">
                              <span className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></span>
                              <span className="text-yellow-600 font-medium">Erro</span>
                            </div>
                          )}
                          {data?.status === 'desconhecido' && (
                            <div className="flex items-center">
                              <span className="h-3 w-3 bg-gray-500 rounded-full mr-2"></span>
                              <span className="text-gray-600 font-medium">Desconhecido</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {data?.time || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/qrcode/${number}`)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Ver QR Code
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {loading && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-center text-gray-500 bg-gray-50">
              <FaSync className="animate-spin mr-2" />
              Atualizando status dos dispositivos...
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
