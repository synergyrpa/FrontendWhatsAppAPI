import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { 
  FaWhatsapp, FaUsers, FaChartLine, FaBell, 
  FaCheckCircle, FaExclamationTriangle, FaCalendarAlt,
  FaEnvelope, FaPhoneAlt, FaPaperPlane, FaDatabase,
  FaHourglassHalf, FaTimes
} from 'react-icons/fa';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNumbers } from '../context/NumbersContext';
import { isAuthenticated, getTokenInfo } from '../utils/auth';
import Chart from 'react-apexcharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const { workers, loading: numbersLoading, erro: numbersErro, waitForNumbersLoaded } = useNumbers();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalMessages: 0,
    messagesDelivered: 0,
    messagesFailed: 0,
    messagesPending: 0,
    activeContacts: 0,
    activeSessions: 0,
    recentActivity: []
  });
  const [relatorios, setRelatorios] = useState([]);
  const [erro, setErro] = useState('');
  const [animated, setAnimated] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState('');

  // Debug: Verificar estado da autenticação e workers
  useEffect(() => {
    console.log('🔍 Dashboard Debug:');
    console.log('- Autenticado:', isAuthenticated());
    console.log('- Token Info:', getTokenInfo());
    console.log('- Workers:', workers);
    console.log('- Numbers Loading:', numbersLoading);
    console.log('- Numbers Erro:', numbersErro);
  }, [workers, numbersLoading, numbersErro]);

  useEffect(() => {
    setAnimated(true);
    // Aguarda os números serem carregados antes de buscar dados
    (async () => {
      await waitForNumbersLoaded?.();
      if (workers && workers.length > 0) {
        setSelectedNumber(workers[0]);
      }
    })();
  }, [workers, waitForNumbersLoaded]);

  useEffect(() => {
    if (selectedNumber) {
      buscarDadosDashboard(selectedNumber);
    }
  }, [selectedNumber]);

  const buscarDadosDashboard = async (numeroSelecionado) => {
    setLoading(true);
    setErro('');
    
    console.log('🎯 Dashboard: Iniciando busca de dados...');
    console.log('📱 Workers disponíveis:', workers);
    
    // Definir datas para os últimos 30 dias
    const dataFinal = new Date().toLocaleDateString('sv-SE');
    const dataInicial = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE');
    
    console.log('📅 Período de consulta:', { dataInicial, dataFinal });
    
    try {
      if (workers && workers.length > 0 && numeroSelecionado) {
        console.log('📊 Dashboard: Buscando relatórios para número:', numeroSelecionado);
        
        const response = await apiClient.get('/api/v2/reports/sends', {
          params: {
            from_number: numeroSelecionado,
            init_time: dataInicial,
            end_time: dataFinal,
          },
        });
        
        console.log('📊 Resposta completa da API:', response);
        const dados = response.data.description || [];
        console.log('✅ Dashboard: Dados carregados:', dados.length, 'registros');
        setRelatorios(dados);
        
        // Contar estatísticas com status em português
        const entregues = dados.filter(item => {
          const status = item.status ? item.status.toLowerCase() : '';
          return status === 'enviado';
        }).length;
        
        const falhas = dados.filter(item => {
          const status = item.status ? item.status.toLowerCase() : '';
          return status === 'falha';
        }).length;
        
        const naFila = dados.filter(item => {
          const status = item.status ? item.status.toLowerCase() : '';
          return status === 'na fila';
        }).length;
        
        // Obter números de destino únicos para contar contatos
        const contatosUnicos = [...new Set(dados.map(item => item.to_number))].length;
        
        // Processar os dados para o dashboard
        setDashboardData({
          totalMessages: dados.length,
          messagesDelivered: entregues,
          messagesFailed: falhas,
          messagesPending: naFila,
          activeContacts: contatosUnicos,
          activeSessions: workers.length,
          recentActivity: dados.slice(0, 5).map((item, id) => ({
            id,
            type: item.message_type || 'message',
            status: item.status || 'na fila',
            number: item.to_number,
            time: new Date(item.date_time_send || item.date_time_queue).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            message: item.message?.substring(0, 50) || 'Sem conteúdo'
          }))
        });
      }
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setErro('Não foi possível carregar os dados do dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  // Cálculo das taxas usando useMemo
  const taxas = useMemo(() => {
    if (dashboardData.totalMessages === 0) {
      return {
        enviado: 0,
        naFila: 0,
        falha: 0
      };
    }
    
    return {
      enviado: Math.round((dashboardData.messagesDelivered / dashboardData.totalMessages) * 100),
      naFila: Math.round((dashboardData.messagesPending / dashboardData.totalMessages) * 100),
      falha: Math.round((dashboardData.messagesFailed / dashboardData.totalMessages) * 100)
    };
  }, [dashboardData]);
  
  // Preparar dados para o gráfico de mensagens por dia
  const prepararDadosGrafico = () => {
    const agrupado = {};
    const hoje = new Date();
    
    // Inicializar os últimos 7 dias com zero
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - i);
      const dataStr = data.toLocaleDateString('sv-SE');
      agrupado[dataStr] = 0;
    }
    
    // Preencher com dados reais
    relatorios.forEach((item) => {
      const data = new Date(item.date_time_queue || item.date_time_send).toLocaleDateString('sv-SE');
      // Só considerar os últimos 7 dias
      if (agrupado[data] !== undefined) {
        agrupado[data] = (agrupado[data] || 0) + 1;
      }
    });
    
    const categoriasOrdenadas = Object.keys(agrupado).sort();
    const valoresOrdenados = categoriasOrdenadas.map((data) => agrupado[data]);
    
    return {
      options: {
        chart: { 
          id: 'mensagens-por-dia', 
          toolbar: { show: false },
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        xaxis: { 
          categories: categoriasOrdenadas.map(data => {
            const date = new Date(data);
            return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
          }),
          labels: {
            style: {
              fontFamily: 'Inter, system-ui, sans-serif',
            }
          }
        },
        colors: ['#3B82F6', '#4F46E5'],
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: "vertical",
            shadeIntensity: 0.3,
            opacityFrom: 0.8,
            opacityTo: 0.9,
            colorStops: [
              {
                offset: 0,
                color: "#3B82F6",
                opacity: 1
              },
              {
                offset: 100,
                color: "#4F46E5",
                opacity: 1
              }
            ]
          }
        },
        grid: {
          borderColor: '#E5E7EB',
          strokeDashArray: 4,
        },
        dataLabels: {
          enabled: false
        },
        tooltip: {
          theme: 'light',
          style: {
            fontSize: '14px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }
        }
      },
      series: [{ name: 'Mensagens', data: valoresOrdenados }],
    };
  };
  
  return (
    <DashboardLayout>
      <div className={`transition-all duration-500 ${animated ? 'opacity-100' : 'opacity-0'}`}>
        {/* Cabeçalho com boas-vindas e data */}
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Bem-vindo ao seu Dashboard</h1>
            <p className="text-gray-600 flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-500" />
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          {/* Seletor de número de WhatsApp */}
          {workers && workers.length > 1 && (
            <div className="flex flex-col items-end ml-4">
              <label className="text-sm text-gray-600 mb-1">Número de WhatsApp</label>
              <select
                value={selectedNumber}
                onChange={e => setSelectedNumber(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              >
                {workers.map((number) => (
                  <option key={number} value={number}>{number}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <button 
              onClick={() => navigate('/reports')}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <FaChartLine className="mr-2 text-blue-500" />
              Ver Relatórios
            </button>
            <button 
              onClick={() => buscarDadosDashboard(selectedNumber)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <FaDatabase className="mr-2 text-blue-500" />
              Atualizar Dados
            </button>
          </div>
        </div>
        
        {/* Mensagem de erro, se houver */}
        {erro && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 mb-6 flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <span>{erro}</span>
          </div>
        )}
        
        {/* Cartões de estatísticas - Agora com 3 cartões para as taxas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Total de Mensagens</h2>
              <div className="bg-blue-100 p-2 rounded-lg">
                <FaEnvelope className="text-blue-600 text-xl" />
              </div>
            </div>
            <div className="flex items-end">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
              ) : (
                <span className="text-3xl font-bold text-gray-800">
                  {dashboardData.totalMessages.toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Últimos 30 dias</p>
          </div>
          
          {/* Taxa de Envio */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Taxa de Envio</h2>
              <div className="bg-green-100 p-2 rounded-lg">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="flex items-end">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
              ) : (
                <span className="text-3xl font-bold text-gray-800">
                  {taxas.enviado}%
                </span>
              )}
              <span className="text-sm text-green-600 ml-2 mb-1">Enviadas</span>
            </div>
            {!loading && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="h-2 rounded-full bg-green-500" 
                  style={{ width: `${taxas.enviado}%` }}
                ></div>
              </div>
            )}
          </div>
          
          {/* Taxa de Fila - NOVO */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Taxa de Espera</h2>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <FaHourglassHalf className="text-yellow-600 text-xl" />
              </div>
            </div>
            <div className="flex items-end">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
              ) : (
                <span className="text-3xl font-bold text-gray-800">
                  {taxas.naFila}%
                </span>
              )}
              <span className="text-sm text-yellow-600 ml-2 mb-1">Na fila</span>
            </div>
            {!loading && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="h-2 rounded-full bg-yellow-500" 
                  style={{ width: `${taxas.naFila}%` }}
                ></div>
              </div>
            )}
          </div>
          
          {/* Taxa de Falha - NOVO */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Taxa de Falha</h2>
              <div className="bg-red-100 p-2 rounded-lg">
                <FaTimes className="text-red-600 text-xl" />
              </div>
            </div>
            <div className="flex items-end">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
              ) : (
                <span className="text-3xl font-bold text-gray-800">
                  {taxas.falha}%
                </span>
              )}
              <span className="text-sm text-red-600 ml-2 mb-1">Falhas</span>
            </div>
            {!loading && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="h-2 rounded-full bg-red-500" 
                  style={{ width: `${taxas.falha}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Gráfico de mensagens por dia - Usando espaço total agora */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-700">Mensagens enviadas (últimos 7 dias)</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : relatorios.length > 0 ? (
            <Chart
              options={prepararDadosGrafico().options}
              series={prepararDadosGrafico().series}
              type="bar"
              height={300}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FaChartLine className="text-gray-300 text-5xl mb-4" />
              <p>Nenhum dado disponível para o período selecionado</p>
            </div>
          )}
        </div>
        
        {/* Contatos e Sessões - Movidos para uma linha separada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Contatos Ativos</h2>
              <div className="bg-indigo-100 p-2 rounded-lg">
                <FaUsers className="text-indigo-600 text-xl" />
              </div>
            </div>
            <div className="flex items-end">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
              ) : (
                <span className="text-3xl font-bold text-gray-800">
                  {dashboardData.activeContacts.toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Contatos únicos contatados</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Sessões Ativas</h2>
              <div className="bg-blue-100 p-2 rounded-lg">
                <FaPhoneAlt className="text-blue-600 text-xl" />
              </div>
            </div>
            <div className="flex items-end">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
              ) : (
                <span className="text-3xl font-bold text-gray-800">
                  {dashboardData.activeSessions}
                </span>
              )}
              <span className="text-sm text-gray-500 ml-2 mb-1">de {workers?.length || 0} cadastrados</span>
            </div>
            {!loading && workers && (
              <div className="flex flex-wrap gap-1 mt-3">
                {workers.slice(0, 3).map((worker, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {worker.slice(-4)}
                  </span>
                ))}
                {workers.length > 3 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    +{workers.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Atividade recente */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Atividade Recente</h2>
            {dashboardData.recentActivity.length > 0 && (
              <button 
                onClick={() => navigate(`/reports?autoload=today&number=${encodeURIComponent(selectedNumber)}`)}
                className="text-blue-600 text-sm hover:text-blue-800 font-medium transition-colors duration-200 flex items-center"
              >
                Ver tudo
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-start">
                  <div className="rounded-full bg-gray-200 h-10 w-10 mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : dashboardData.recentActivity.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="py-3 flex items-start">
                  <div className={`p-2 rounded-full flex-shrink-0 mr-3 ${
                    activity.status.toLowerCase() === 'enviado' ? 'bg-green-100' :
                    activity.status.toLowerCase() === 'falha' ? 'bg-red-100' :
                    activity.status.toLowerCase() === 'na fila' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    <FaWhatsapp className={`text-lg ${
                      activity.status.toLowerCase() === 'enviado' ? 'text-green-600' :
                      activity.status.toLowerCase() === 'falha' ? 'text-red-600' :
                      activity.status.toLowerCase() === 'na fila' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-gray-800 truncate">{activity.number}</p>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">{activity.message}</p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        activity.status.toLowerCase() === 'enviado' ? 'bg-green-100 text-green-800' :
                        activity.status.toLowerCase() === 'falha' ? 'bg-red-100 text-red-800' :
                        activity.status.toLowerCase() === 'na fila' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status}
                      </span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        activity.type === 'text' ? 'bg-gray-100 text-gray-800' :
                        activity.type === 'image' ? 'bg-purple-100 text-purple-800' :
                        activity.type === 'video' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FaBell className="text-gray-300 text-5xl mb-4" />
              <p>Nenhuma atividade recente para mostrar</p>
              <button 
                onClick={buscarDadosDashboard}
                className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Atualizar dados
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
