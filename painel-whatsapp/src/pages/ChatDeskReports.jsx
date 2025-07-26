import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getUserEmail } from '../utils/auth';
import { 
  FaChartBar, 
  FaDownload, 
  FaExclamationTriangle, 
  FaSpinner, 
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaArrowLeft,
  FaEnvelope,
  FaWhatsapp
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Classe para API do ChatDesk baseada na documentação
class ChatDeskReportsAPI {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async makeRequest(endpoint, filters) {
    if (!this.token) {
      throw new Error('Token de autenticação é obrigatório');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(filters)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    return response;
  }

  async getAccountByAgentEmail(email) {
    const response = await this.makeRequest('/agent/account', { agent_email: email });
    return await response.json();
  }

  async getJSONReport(filters) {
    const response = await this.makeRequest('/json', filters);
    return await response.json();
  }

  async downloadExcel(filters, filename = null) {
    const response = await this.makeRequest('/excel', filters);
    const blob = await response.blob();
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `chatdesk_report_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default function ChatDeskReports() {
  const navigate = useNavigate();
  const userEmail = getUserEmail();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  
  const [filters, setFilters] = useState({
    days: 30,
    start_date: null,
    end_date: null,
    agent_id: undefined,
    status: null
  });

  // Configuração da API (usar variáveis de ambiente)
  const API_BASE_URL = import.meta.env.VITE_CHATDESK_API_URL || 'http://localhost:8000/api/v1/report';
  const API_TOKEN = import.meta.env.VITE_CHATDESK_API_TOKEN || 'your-secret-token-here';
  
  const api = new ChatDeskReportsAPI(API_BASE_URL, API_TOKEN);

  // Verificar acesso do usuário ao carregar a página
  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    if (!userEmail) {
      setHasAccess(false);
      setError('Email do usuário não encontrado');
      return;
    }

    setLoading(true);
    try {
      const accountData = await api.getAccountByAgentEmail(userEmail);
      setAccountInfo(accountData);
      setHasAccess(true);
      setFilters(prev => ({ ...prev, account_id: accountData.account_id }));
      
      // Carregar relatório inicial
      await loadReport({ ...filters, account_id: accountData.account_id });
    } catch (err) {
      console.error('Erro ao verificar acesso:', err);
      setHasAccess(false);
      setError('Usuário não tem acesso aos relatórios do ChatDesk');
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async (reportFilters = filters) => {
    if (!hasAccess || !accountInfo) return;

    setLoading(true);
    setError(null);

    try {
      const reportData = await api.getJSONReport({
        agent_email: userEmail,
        ...reportFilters
      });
      setData(reportData);
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
      setError(err.message || 'Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleDownloadExcel = async () => {
    if (!hasAccess || !accountInfo) return;

    try {
      setLoading(true);
      await api.downloadExcel({
        agent_email: userEmail,
        ...filters
      }, 'chatdesk_report.xlsx');
    } catch (err) {
      console.error('Erro no download:', err);
      setError(err.message || 'Erro no download do relatório');
    } finally {
      setLoading(false);
    }
  };

  // Se ainda está verificando acesso
  if (hasAccess === null) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Verificando acesso aos relatórios...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Se não tem acesso
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center mb-6">
              <button
                onClick={() => navigate('/chatdesk')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-all"
              >
                <FaArrowLeft className="text-xl" />
              </button>
              <h1 className="text-3xl font-bold text-gray-800">Relatórios ChatDesk</h1>
            </div>

            {/* Access Denied Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaExclamationTriangle className="text-orange-600 text-4xl" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Acesso Restrito
              </h2>
              
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Seu email <strong>{userEmail}</strong> não possui acesso aos relatórios do ChatDesk. 
                Para obter acesso a este serviço, entre em contato com nossa equipe de suporte.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Como obter acesso:
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto">
                  <a 
                    href="mailto:suporte@synergyrpa.com?subject=Solicitação de Acesso - ChatDesk Relatórios"
                    className="flex items-center justify-center bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-all"
                  >
                    <FaEnvelope className="mr-2" />
                    Email Suporte
                  </a>
                  
                  <a 
                    href="https://wa.me/5511999999999?text=Olá, gostaria de solicitar acesso aos relatórios do ChatDesk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-all"
                  >
                    <FaWhatsapp className="mr-2" />
                    WhatsApp
                  </a>
                </div>

                <button
                  onClick={() => navigate('/chatdesk')}
                  className="mt-6 bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition-all"
                >
                  Voltar ao ChatDesk
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Se tem acesso - mostrar relatórios
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/chatdesk')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-all"
              >
                <FaArrowLeft className="text-xl" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Relatórios ChatDesk</h1>
                {accountInfo && (
                  <p className="text-gray-600">
                    Conta: <span className="font-medium">{accountInfo.account_name}</span> | 
                    Agente: <span className="font-medium">{accountInfo.agent_name}</span>
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={handleDownloadExcel}
              disabled={loading}
              className="flex items-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaDownload className="mr-2" />}
              Baixar Excel
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros do Relatório</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Últimos N dias
                </label>
                <input
                  type="number"
                  value={filters.days}
                  onChange={(e) => handleFilterChange('days', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="365"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="open">Aberto</option>
                  <option value="resolved">Resolvido</option>
                  <option value="pending">Pendente</option>
                  <option value="snoozed">Adiado</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => loadReport()}
                disabled={loading}
                className="flex items-center bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaChartBar className="mr-2" />}
                Atualizar Relatório
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-red-600 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Métricas */}
          {data?.data?.statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center">
                  <FaUsers className="text-blue-600 text-2xl mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Conversas</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {data.data.statistics.total_conversations}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-600 text-2xl mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Taxa Resposta</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {data.data.statistics.response_rate_percentage}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center">
                  <FaClock className="text-orange-600 text-2xl mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tempo Médio</h3>
                    <p className="text-2xl font-bold text-orange-600">
                      {data.data.statistics.average_response_time?.toFixed(1) || 'N/A'} min
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center">
                  <FaChartBar className="text-purple-600 text-2xl mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Período</h3>
                    <p className="text-sm font-bold text-gray-600">
                      {data.start_date} <br/> a {data.end_date}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de Conversas */}
          {data?.data?.conversations && data.data.conversations.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  Conversas Detalhadas ({data.data.conversations.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tempo Resposta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.data.conversations.map((conv, index) => (
                      <tr key={conv.conversation_id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {conv.display_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {conv.customer_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {conv.agent_name || 'Não atribuído'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {conv.response_time_minutes 
                            ? `${conv.response_time_minutes.toFixed(1)} min`
                            : 'Sem resposta'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            conv.performance_category === 'Excellent' ? 'bg-green-100 text-green-800' :
                            conv.performance_category === 'Good' ? 'bg-blue-100 text-blue-800' :
                            conv.performance_category === 'Poor' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {conv.performance_category || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {conv.conversation_date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {data?.data?.conversations && data.data.conversations.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <FaChartBar className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Nenhuma conversa encontrada
              </h3>
              <p className="text-gray-600">
                Não há conversas no período selecionado. Tente ajustar os filtros.
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg text-center">
                <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                <p className="text-gray-700">Carregando relatório...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
