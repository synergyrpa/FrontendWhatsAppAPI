# Exemplos Práticos - API Chatwoot Reports

Este arquivo contém exemplos prontos para uso da API de relatórios, organizados por tecnologia e caso de uso.

## � Autenticação

**IMPORTANTE**: Todos os endpoints de relatório requerem autenticação via token Bearer. 

### Configuração do Token
```javascript
const API_TOKEN = "your-secret-token-here"; // Configure seu token
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
};
```

### Obtendo o Token
1. O token é configurado no ambiente do servidor (variável `STATIC_TOKEN`)
2. Para desenvolvimento, use: `your-secret-token-here`
3. Para produção, configure um token seguro e compartilhe com os desenvolvedores frontend

### Testando Autenticação no Swagger
1. Acesse: `http://localhost:8000/docs`
2. Clique no botão **"Authorize"** no topo da página
3. Digite: `your-secret-token-here` (sem "Bearer")
4. Agora você pode testar os endpoints protegidos

### ⚠️ Erros Comuns de Autenticação
- **401 Unauthorized**: Token ausente ou inválido
- **403 Forbidden**: Token correto mas sem permissões
- **Swagger não funciona**: Certifique-se de clicar em "Authorize" primeiro

## �🚀 Quick Start

### Teste Rápido com cURL
```bash
# Definir o token (substitua pelo seu token real)
export API_TOKEN="your-secret-token-here"

# Buscar account_id por email do agente
curl -X POST "http://localhost:8000/api/v1/report/agent/account" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{"agent_email": "agent@company.com"}'

# Relatório JSON básico (usando account_id)
curl -X POST "http://localhost:8000/api/v1/report/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{"account_id": 1, "days": 7}'

# Download Excel
curl -X POST "http://localhost:8000/api/v1/report/excel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{"account_id": 1, "days": 30}' \
  --output relatorio.xlsx
```

## 📱 JavaScript Vanilla

### Cliente API Completo
```javascript
class ChatwootReportsAPI {
  constructor(baseUrl = 'http://localhost:8000/api/v1/report', token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  setToken(token) {
    this.token = token;
  }

  async makeRequest(endpoint, data) {
    if (!this.token) {
      throw new Error('Token de autenticação é obrigatório. Use setToken() ou passe no construtor.');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    return response;
  }

  // Buscar account_id por email do agente
  async getAccountByAgentEmail(agentEmail) {
    const response = await this.makeRequest('/agent/account', { agent_email: agentEmail });
    return await response.json();
  }

  // Gerar relatório JSON
  async getJSONReport(filters) {
    const response = await this.makeRequest('/json', filters);
    return await response.json();
  }

  // Gerar relatório HTML
  async getHTMLReport(filters) {
    const response = await this.makeRequest('/html', filters);
    const data = await response.json();
    return data.html_content;
  }

  // Download Excel
  async downloadExcel(filters, filename = null) {
    const response = await this.makeRequest('/excel', filters);
    const blob = await response.blob();
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `chatwoot_report_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Validar filtros antes de enviar
  validateFilters(filters) {
    // Deve ter account_id OU agent_email
    if (!filters.account_id && !filters.agent_email) {
      throw new Error('É obrigatório fornecer account_id OU agent_email');
    }

    if (filters.account_id && filters.account_id <= 0) {
      throw new Error('account_id deve ser maior que 0');
    }

    if (filters.agent_email && !filters.agent_email.includes('@')) {
      throw new Error('agent_email deve ter formato válido');
    }

    if (filters.start_date && !filters.end_date) {
      throw new Error('Se start_date for fornecido, end_date também deve ser fornecido');
    }

    if (filters.end_date && !filters.start_date) {
      throw new Error('Se end_date for fornecido, start_date também deve ser fornecido');
    }

    return true;
  }
}

// Uso
const API_TOKEN = "your-secret-token-here"; // Configure seu token
const api = new ChatwootReportsAPI('http://localhost:8000/api/v1/report', API_TOKEN);

// Exemplo 1: Buscar account_id por email do agente
const agentInfo = await api.getAccountByAgentEmail('agent@company.com');
console.log('Account ID:', agentInfo.account_id);
console.log('Nome do agente:', agentInfo.agent_name);
console.log('Nome da conta:', agentInfo.account_name);

// Exemplo 2: Relatório usando email do agente
const reportByEmail = await api.getJSONReport({
  agent_email: 'agent@company.com',
  days: 30
});

// Exemplo 3: Relatório básico com account_id
const basicReport = await api.getJSONReport({
  account_id: 1,
  days: 30
});

// Exemplo 4: Com filtros
const filteredReport = await api.getJSONReport({
  account_id: 1,
  start_date: '2025-07-01',
  end_date: '2025-07-12',
  agent_id: 5,
  status: 'resolved'
});

// Exemplo 5: Download Excel usando email do agente
await api.downloadExcel({
  agent_email: 'agent@company.com',
  days: 7
}, 'relatorio_semanal.xlsx');
```

### Dashboard Simples
```html
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard Chatwoot</title>
    <style>
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .card { background: #f5f5f5; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { font-size: 2em; font-weight: bold; color: #2563eb; }
        .loading { opacity: 0.6; pointer-events: none; }
        .error { color: #dc2626; background: #fef2f2; padding: 10px; border-radius: 4px; }
        .filters { margin-bottom: 20px; padding: 20px; background: #ffffff; border-radius: 8px; }
        .filters input, .filters select { margin: 5px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Dashboard de Relatórios Chatwoot</h1>
    
    <div class="filters">
        <h3>Filtros</h3>
        <input type="number" id="accountId" placeholder="Account ID" value="1">
        <input type="email" id="agentEmail" placeholder="Email do Agente (alternativo)">
        <input type="number" id="days" placeholder="Últimos N dias" value="30">
        <input type="date" id="startDate" placeholder="Data início">
        <input type="date" id="endDate" placeholder="Data fim">
        <input type="number" id="agentId" placeholder="Agent ID (opcional)">
        <select id="status">
            <option value="">Todos os status</option>
            <option value="open">Aberto</option>
            <option value="resolved">Resolvido</option>
            <option value="pending">Pendente</option>
            <option value="snoozed">Adiado</option>
        </select>
        <button onclick="loadDashboard()">Atualizar Dashboard</button>
        <button onclick="downloadReport()">Baixar Excel</button>
    </div>

    <div id="error" class="error" style="display: none;"></div>
    
    <div id="dashboard" class="dashboard">
        <div class="card">
            <h3>Total de Conversas</h3>
            <div id="totalConversations" class="metric">-</div>
        </div>
        
        <div class="card">
            <h3>Taxa de Resposta</h3>
            <div id="responseRate" class="metric">-</div>
        </div>
        
        <div class="card">
            <h3>Tempo Médio (min)</h3>
            <div id="avgTime" class="metric">-</div>
        </div>
        
        <div class="card">
            <h3>Período</h3>
            <div id="period" class="metric" style="font-size: 1em;">-</div>
        </div>
    </div>

    <div id="reportContainer" style="margin-top: 30px;"></div>

    <script>
        const API_TOKEN = "your-secret-token-here"; // Configure seu token
        const api = new ChatwootReportsAPI('http://localhost:8000/api/v1/report', API_TOKEN);

        function getFilters() {
            const filters = {};
            
            const accountId = document.getElementById('accountId').value;
            const agentEmail = document.getElementById('agentEmail').value;
            const days = document.getElementById('days').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const agentId = document.getElementById('agentId').value;
            const status = document.getElementById('status').value;

            // Priorizar account_id se fornecido, senão usar agent_email
            if (accountId) {
                filters.account_id = parseInt(accountId);
            } else if (agentEmail) {
                filters.agent_email = agentEmail;
            }

            if (startDate && endDate) {
                filters.start_date = startDate;
                filters.end_date = endDate;
            } else if (days) {
                filters.days = parseInt(days);
            }

            if (agentId) filters.agent_id = parseInt(agentId);
            if (status) filters.status = status;

            return filters;
        }

        async function loadDashboard() {
            const dashboard = document.getElementById('dashboard');
            const errorDiv = document.getElementById('error');
            
            try {
                dashboard.classList.add('loading');
                errorDiv.style.display = 'none';

                const filters = getFilters();
                api.validateFilters(filters);

                const report = await api.getJSONReport(filters);
                const stats = report.data.statistics;

                document.getElementById('totalConversations').textContent = stats.total_conversations;
                document.getElementById('responseRate').textContent = `${stats.response_rate_percentage}%`;
                document.getElementById('avgTime').textContent = stats.average_response_time?.toFixed(1) || 'N/A';
                document.getElementById('period').textContent = `${report.start_date} a ${report.end_date}`;

                // Mostrar tabela de conversas
                displayConversationsTable(report.data.conversations);

            } catch (error) {
                errorDiv.textContent = `Erro: ${error.message}`;
                errorDiv.style.display = 'block';
                console.error('Erro ao carregar dashboard:', error);
            } finally {
                dashboard.classList.remove('loading');
            }
        }

        function displayConversationsTable(conversations) {
            const container = document.getElementById('reportContainer');
            
            if (conversations.length === 0) {
                container.innerHTML = '<p>Nenhuma conversa encontrada no período.</p>';
                return;
            }

            let html = `
                <h3>Conversas Detalhadas</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #ddd;">ID</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">Cliente</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">Agente</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">Tempo Resposta</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">Performance</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">Data</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            conversations.forEach(conv => {
                const responseTime = conv.response_time_minutes 
                    ? `${conv.response_time_minutes.toFixed(1)} min`
                    : 'Sem resposta';
                
                html += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">${conv.display_id}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${conv.customer_name || 'N/A'}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${conv.agent_name || 'Não atribuído'}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${responseTime}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${conv.performance_category}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${conv.conversation_date}</td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        }

        async function downloadReport() {
            try {
                const filters = getFilters();
                api.validateFilters(filters);
                await api.downloadExcel(filters, 'relatorio_chatwoot.xlsx');
            } catch (error) {
                alert(`Erro no download: ${error.message}`);
            }
        }

        // Carregar dashboard na inicialização
        window.onload = () => loadDashboard();
    </script>
</body>
</html>
```

## ⚛️ React/Next.js

### Hook Avançado
```typescript
import { useState, useCallback, useRef } from 'react';

interface ReportFilters {
  account_id: number;
  days?: number;
  start_date?: string;
  end_date?: string;
  agent_id?: number;
  inbox_id?: number;
  status?: 'open' | 'resolved' | 'pending' | 'snoozed';
}

interface UseReportAPIReturn {
  data: any;
  loading: boolean;
  error: string | null;
  generateReport: (format: 'json' | 'html' | 'excel', filters: ReportFilters) => Promise<any>;
  downloadExcel: (filters: ReportFilters, filename?: string) => Promise<void>;
  clearError: () => void;
}

export const useReportAPI = (baseUrl = '/api/v1/report', token = null): UseReportAPIReturn => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const makeRequest = useCallback(async (endpoint: string, filters: ReportFilters) => {
    if (!token) {
      throw new Error('Token de autenticação é obrigatório');
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(filters),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    return response;
  }, [baseUrl, token]);

  const generateReport = useCallback(async (
    format: 'json' | 'html' | 'excel',
    filters: ReportFilters
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest(`/${format}`, filters);
      
      let result;
      if (format === 'excel') {
        result = await response.blob();
      } else {
        result = await response.json();
      }

      setData(result);
      return result;

    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null; // Requisição cancelada
      }
      const errorMessage = err.message || 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const downloadExcel = useCallback(async (
    filters: ReportFilters,
    filename?: string
  ) => {
    const blob = await generateReport('excel', filters) as Blob;
    
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `chatwoot_report_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [generateReport]);

  return {
    data,
    loading,
    error,
    generateReport,
    downloadExcel,
    clearError
  };
};
```

### Componente Completo
```tsx
import React, { useState, useEffect } from 'react';
import { useReportAPI } from './hooks/useReportAPI';

interface ReportDashboardProps {
  defaultAccountId?: number;
}

const ReportDashboard: React.FC<ReportDashboardProps> = ({ 
  defaultAccountId = 1 
}) => {
  const API_TOKEN = "your-secret-token-here"; // Configure seu token
  const { data, loading, error, generateReport, downloadExcel, clearError } = useReportAPI('/api/v1/report', API_TOKEN);
  const [filters, setFilters] = useState({
    account_id: defaultAccountId,
    days: 30,
    start_date: '',
    end_date: '',
    agent_id: undefined as number | undefined,
    inbox_id: undefined as number | undefined,
    status: undefined as string | undefined
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleGenerateReport = async () => {
    try {
      await generateReport('json', filters);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      await downloadExcel(filters, 'relatorio_chatwoot.xlsx');
    } catch (error) {
      console.error('Erro no download:', error);
    }
  };

  // Auto-carregar relatório quando filtros mudarem
  useEffect(() => {
    if (filters.account_id) {
      handleGenerateReport();
    }
  }, [filters.account_id, filters.days]);

  return (
    <div className="report-dashboard p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard de Relatórios</h1>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Account ID *</label>
            <input
              type="number"
              value={filters.account_id}
              onChange={(e) => handleFilterChange('account_id', parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Últimos N dias</label>
            <input
              type="number"
              value={filters.days}
              onChange={(e) => handleFilterChange('days', parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              placeholder="Ex: 30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Todos</option>
              <option value="open">Aberto</option>
              <option value="resolved">Resolvido</option>
              <option value="pending">Pendente</option>
              <option value="snoozed">Adiado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data Início</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data Fim</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Agent ID</label>
            <input
              type="number"
              value={filters.agent_id || ''}
              onChange={(e) => handleFilterChange('agent_id', parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Gerando...' : 'Atualizar Relatório'}
          </button>
          
          <button
            onClick={handleDownloadExcel}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Gerando...' : 'Baixar Excel'}
          </button>

          {error && (
            <button
              onClick={clearError}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Limpar Erro
            </button>
          )}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Erro:</strong> {error}
        </div>
      )}

      {/* Métricas */}
      {data?.data?.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total de Conversas</h3>
            <p className="text-2xl font-bold text-blue-600">
              {data.data.statistics.total_conversations}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Taxa de Resposta</h3>
            <p className="text-2xl font-bold text-green-600">
              {data.data.statistics.response_rate_percentage}%
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Tempo Médio</h3>
            <p className="text-2xl font-bold text-orange-600">
              {data.data.statistics.average_response_time?.toFixed(1) || 'N/A'} min
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Período</h3>
            <p className="text-sm font-bold text-gray-600">
              {data.start_date} a {data.end_date}
            </p>
          </div>
        </div>
      )}

      {/* Tabela de Conversas */}
      {data?.data?.conversations && data.data.conversations.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h3 className="text-lg font-semibold p-4 border-b">Conversas Detalhadas</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Agente</th>
                  <th className="px-4 py-2 text-left">Tempo Resposta</th>
                  <th className="px-4 py-2 text-left">Performance</th>
                  <th className="px-4 py-2 text-left">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.data.conversations.map((conv: any, index: number) => (
                  <tr key={conv.conversation_id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-2">{conv.display_id}</td>
                    <td className="px-4 py-2">{conv.customer_name || 'N/A'}</td>
                    <td className="px-4 py-2">{conv.agent_name || 'Não atribuído'}</td>
                    <td className="px-4 py-2">
                      {conv.response_time_minutes 
                        ? `${conv.response_time_minutes.toFixed(1)} min`
                        : 'Sem resposta'
                      }
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        conv.performance_category.includes('Excelente') ? 'bg-green-100 text-green-800' :
                        conv.performance_category.includes('Bom') ? 'bg-blue-100 text-blue-800' :
                        conv.performance_category.includes('Regular') ? 'bg-yellow-100 text-yellow-800' :
                        conv.performance_category.includes('Lento') ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {conv.performance_category}
                      </span>
                    </td>
                    <td className="px-4 py-2">{conv.conversation_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-center">Gerando relatório...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDashboard;
```

## 📊 Vue.js

### Composable
```typescript
// composables/useReportAPI.ts
import { ref, computed } from 'vue';

export const useReportAPI = (baseUrl = '/api/v1/report', token = null) => {
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const makeRequest = async (endpoint: string, filters: any) => {
    if (!token) {
      throw new Error('Token de autenticação é obrigatório');
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(filters)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response;
  };

  const generateReport = async (format: string, filters: any) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await makeRequest(`/${format}`, filters);
      const result = format === 'excel' ? await response.blob() : await response.json();
      data.value = result;
      return result;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const statistics = computed(() => {
    return data.value?.data?.statistics || null;
  });

  const conversations = computed(() => {
    return data.value?.data?.conversations || [];
  });

  return {
    data,
    loading,
    error,
    statistics,
    conversations,
    generateReport
  };
};
```

### Componente Vue
```vue
<template>
  <div class="report-dashboard">
    <h1>Dashboard de Relatórios Chatwoot</h1>

    <!-- Filtros -->
    <form @submit.prevent="handleSubmit" class="filters">
      <div class="form-group">
        <label>Account ID *</label>
        <input v-model.number="filters.account_id" type="number" required />
      </div>

      <div class="form-group">
        <label>Últimos N dias</label>
        <input v-model.number="filters.days" type="number" />
      </div>

      <div class="form-group">
        <label>Status</label>
        <select v-model="filters.status">
          <option value="">Todos</option>
          <option value="open">Aberto</option>
          <option value="resolved">Resolvido</option>
          <option value="pending">Pendente</option>
          <option value="snoozed">Adiado</option>
        </select>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Gerando...' : 'Gerar Relatório' }}
      </button>

      <button type="button" @click="downloadExcel" :disabled="loading">
        Baixar Excel
      </button>
    </form>

    <!-- Erro -->
    <div v-if="error" class="error">
      Erro: {{ error }}
    </div>

    <!-- Métricas -->
    <div v-if="statistics" class="metrics">
      <div class="metric-card">
        <h3>Total de Conversas</h3>
        <span class="metric-value">{{ statistics.total_conversations }}</span>
      </div>

      <div class="metric-card">
        <h3>Taxa de Resposta</h3>
        <span class="metric-value">{{ statistics.response_rate_percentage }}%</span>
      </div>

      <div class="metric-card">
        <h3>Tempo Médio</h3>
        <span class="metric-value">
          {{ statistics.average_response_time?.toFixed(1) || 'N/A' }} min
        </span>
      </div>
    </div>

    <!-- Tabela -->
    <div v-if="conversations.length > 0" class="conversations-table">
      <h3>Conversas Detalhadas</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Agente</th>
            <th>Tempo Resposta</th>
            <th>Performance</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="conv in conversations" :key="conv.conversation_id">
            <td>{{ conv.display_id }}</td>
            <td>{{ conv.customer_name || 'N/A' }}</td>
            <td>{{ conv.agent_name || 'Não atribuído' }}</td>
            <td>
              {{ conv.response_time_minutes 
                ? `${conv.response_time_minutes.toFixed(1)} min`
                : 'Sem resposta' 
              }}
            </td>
            <td>{{ conv.performance_category }}</td>
            <td>{{ conv.conversation_date }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { useReportAPI } from '@/composables/useReportAPI';

const API_TOKEN = "your-secret-token-here"; // Configure seu token
const { data, loading, error, statistics, conversations, generateReport } = useReportAPI('/api/v1/report', API_TOKEN);

const filters = reactive({
  account_id: 1,
  days: 30,
  status: ''
});

const handleSubmit = async () => {
  try {
    await generateReport('json', filters);
  } catch (err) {
    console.error('Erro ao gerar relatório:', err);
  }
};

const downloadExcel = async () => {
  try {
    const blob = await generateReport('excel', filters);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatwoot_report_${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro no download:', err);
  }
};

onMounted(() => {
  handleSubmit();
});
</script>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.metric-value {
  font-size: 2em;
  font-weight: bold;
  color: #2563eb;
}

.error {
  background: #fef2f2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  background: #f9fafb;
  font-weight: 600;
}
</style>
```

---

## 🛠️ Ferramentas e Utilitários

### Validador de Filtros
```javascript
class ReportValidator {
  static validateFilters(filters) {
    const errors = [];

    // Account ID obrigatório
    if (!filters.account_id || filters.account_id <= 0) {
      errors.push('account_id é obrigatório e deve ser maior que 0');
    }

    // Validar datas
    if (filters.start_date && !filters.end_date) {
      errors.push('Se start_date for fornecido, end_date também deve ser fornecido');
    }

    if (filters.end_date && !filters.start_date) {
      errors.push('Se end_date for fornecido, start_date também deve ser fornecido');
    }

    // Validar formato de data
    if (filters.start_date && !this.isValidDateFormat(filters.start_date)) {
      errors.push('start_date deve estar no formato YYYY-MM-DD');
    }

    if (filters.end_date && !this.isValidDateFormat(filters.end_date)) {
      errors.push('end_date deve estar no formato YYYY-MM-DD');
    }

    // Validar período
    if (filters.start_date && filters.end_date) {
      const start = new Date(filters.start_date);
      const end = new Date(filters.end_date);
      
      if (start > end) {
        errors.push('start_date deve ser anterior a end_date');
      }

      // Verificar se não é muito no passado (opcional)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (start < oneYearAgo) {
        errors.push('start_date não pode ser superior a 1 ano atrás');
      }
    }

    // Validar days
    if (filters.days && filters.days <= 0) {
      errors.push('days deve ser maior que 0');
    }

    if (filters.days && filters.days > 365) {
      errors.push('days não pode ser maior que 365');
    }

    // Validar IDs opcionais
    if (filters.agent_id && filters.agent_id <= 0) {
      errors.push('agent_id deve ser maior que 0');
    }

    if (filters.inbox_id && filters.inbox_id <= 0) {
      errors.push('inbox_id deve ser maior que 0');
    }

    // Validar status
    const validStatuses = ['open', 'resolved', 'pending', 'snoozed'];
    if (filters.status && !validStatuses.includes(filters.status)) {
      errors.push(`status deve ser um dos valores: ${validStatuses.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static isValidDateFormat(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  static sanitizeFilters(filters) {
    const sanitized = { ...filters };

    // Remover campos vazios ou nulos
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === '' || sanitized[key] === null || sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });

    // Converter strings numéricas
    ['account_id', 'days', 'agent_id', 'inbox_id'].forEach(key => {
      if (sanitized[key] && typeof sanitized[key] === 'string') {
        const num = parseInt(sanitized[key]);
        if (!isNaN(num)) {
          sanitized[key] = num;
        }
      }
    });

    return sanitized;
  }
}

// Uso
const filters = {
  account_id: "1",
  days: "30",
  status: "resolved"
};

const sanitized = ReportValidator.sanitizeFilters(filters);
const validation = ReportValidator.validateFilters(sanitized);

if (!validation.isValid) {
  console.error('Erros de validação:', validation.errors);
} else {
  console.log('Filtros válidos:', sanitized);
}
```

### Cache Manager
```javascript
class ReportCache {
  constructor(maxAge = 5 * 60 * 1000) { // 5 minutos
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  generateKey(filters) {
    return JSON.stringify(filters, Object.keys(filters).sort());
  }

  set(filters, data) {
    const key = this.generateKey(filters);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(filters) {
    const key = this.generateKey(filters);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Verificar se expirou
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Uso com API
const cache = new ReportCache();

const getCachedReport = async (filters) => {
  // Tentar buscar no cache primeiro
  const cached = cache.get(filters);
  if (cached) {
    console.log('Dados do cache');
    return cached;
  }

  // Se não estiver no cache, buscar da API
  const API_TOKEN = "your-secret-token-here"; // Configure seu token
  const api = new ChatwootReportsAPI('http://localhost:8000/api/v1/report', API_TOKEN);
  const data = await api.getJSONReport(filters);
  
  // Salvar no cache
  cache.set(filters, data);
  
  return data;
};
```

---

Estes exemplos cobrem a maioria dos casos de uso comuns para consumir a API de relatórios Chatwoot. Eles incluem validação, tratamento de erros, cache, e interfaces responsivas para diferentes frameworks.
