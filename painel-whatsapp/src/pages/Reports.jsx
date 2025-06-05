import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Chart from 'react-apexcharts';
import DashboardLayout from '../layouts/DashboardLayout';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parse } from 'date-fns';
import { useNumbers } from '../context/NumbersContext';
import { FaFilter, FaFileExcel, FaChartBar, FaSearch, FaCalendarAlt, FaPhoneAlt, FaExclamationCircle } from 'react-icons/fa';

export default function Reports() {
  const location = useLocation();
  const { workers, admins, numbersLoading, numbersErro } = useNumbers();
  const [relatorios, setRelatorios] = useState([]);
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [numeroSelecionado, setNumeroSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [animated, setAnimated] = useState(false);
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false);
  const [autoLoadExecuted, setAutoLoadExecuted] = useState(false);
  const [isAutoLoaded, setIsAutoLoaded] = useState(false);

  useEffect(() => {
    setAnimated(true);
  }, []);

  // Efeito para carregar automaticamente dados do dia atual quando vem da dashboard
  useEffect(() => {
    const autoLoadReports = async () => {
      // Verifica se vem da dashboard (sem parâmetros específicos na URL)
      // ou se é o primeiro carregamento da página
      if (!autoLoadExecuted && workers && workers.length > 0) {
        console.log('🚀 Reports: Auto-carregando dados do dia atual...');
        
        // Pega parâmetros da URL
        const urlParams = new URLSearchParams(location.search);
        const autoload = urlParams.get('autoload');
        const numberFromUrl = urlParams.get('number');
        
        // Define data atual
        const hoje = new Date().toLocaleDateString('sv-SE'); // formato YYYY-MM-DD
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        const amanhaFormatado = amanha.toLocaleDateString('sv-SE');
        
        setDataInicial(hoje);
        setDataFinal(amanhaFormatado);
        
        // Seleciona o número: primeiro tenta o da URL, depois o primeiro disponível
        let numeroParaUsar = workers[0]; // padrão
        if (numberFromUrl && workers.includes(numberFromUrl)) {
          numeroParaUsar = numberFromUrl;
          console.log('📱 Reports: Usando número da Dashboard:', numeroParaUsar);
        } else if (workers.length > 0) {
          numeroParaUsar = workers[0];
          console.log('📱 Reports: Usando primeiro número disponível:', numeroParaUsar);
        }
        
        setNumeroSelecionado(numeroParaUsar);
        
        // Executa busca automaticamente apenas se for autoload=today
        if (autoload === 'today') {
          setTimeout(async () => {
            try {
              setLoading(true);
              setErro('');
              setPesquisaRealizada(true);
              setIsAutoLoaded(true);
              
              console.log('🔍 Reports: Buscando dados para:', {
                numero: numeroParaUsar,
                dataInicial: hoje,
                dataFinal: amanhaFormatado
              });
              
              const response = await apiClient.get('/api/v2/reports/sends', {
                params: {
                  from_number: numeroParaUsar,
                  init_time: hoje,
                  end_time: amanhaFormatado,
                },
              });
              
              console.log('✅ Reports: Dados do dia atual carregados:', response.data);
              if (response.data.description && Array.isArray(response.data.description)) {
                setRelatorios(response.data.description);
              } else {
                setRelatorios([]);
              }
            } catch (err) {
              console.error('❌ Reports: Erro ao carregar dados do dia atual:', err);
              setErro(err.response?.data?.description || 'Erro ao carregar relatórios do dia atual');
            } finally {
              setLoading(false);
            }
          }, 500); // Pequeno delay para garantir que a interface foi renderizada
        }
        
        setAutoLoadExecuted(true);
      }
    };

    if (!numbersLoading && !numbersErro) {
      autoLoadReports();
    }
  }, [workers, numbersLoading, numbersErro, autoLoadExecuted, location.search]);

  const buscarRelatorios = async () => {
    if (!numeroSelecionado) {
      setErro('Selecione um número para visualizar os relatórios');
      return;
    }

    setLoading(true);
    setErro('');
    setPesquisaRealizada(true);

    try {
      console.log('🔍 Reports: Buscando relatórios para:', numeroSelecionado);
      const response = await apiClient.get('/api/v2/reports/sends', {
        params: {
          from_number: numeroSelecionado,
          init_time: dataInicial,
          end_time: dataFinal,
        },
      });
      
      console.log('✅ Reports: Relatórios carregados:', response.data);
      if (response.data.description && Array.isArray(response.data.description)) {
        setRelatorios(response.data.description);
      } else {
        setRelatorios([]);
      }
    } catch (err) {
      console.error('Erro ao buscar relatórios:', err);
      setErro(err.response?.data?.description || 'Erro ao buscar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(relatorios);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatórios');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'relatorios.xlsx');
  };

  const prepararDadosGrafico = () => {
    const agrupado = {};
  
    relatorios.forEach((item) => {
      const data = new Date(item.date_time_queue).toLocaleDateString('sv-SE');
      agrupado[data] = (agrupado[data] || 0) + 1;
    });
  
    const categoriasOrdenadas = Object.keys(agrupado).sort();
    const valoresOrdenados = categoriasOrdenadas.map((data) => agrupado[data]);
  
    return {
      options: {
        chart: { 
          id: 'mensagens-por-dia', 
          toolbar: { show: false },
          fontFamily: 'Inter, system-ui, sans-serif',
          dropShadow: {
            enabled: true,
            opacity: 0.3,
            blur: 5,
            left: 0,
            top: 0
          },
        },
        xaxis: { 
          categories: categoriasOrdenadas,
          labels: {
            style: {
              fontFamily: 'Inter, system-ui, sans-serif',
            }
          }
        },
        title: { 
          text: 'Mensagens por Dia', 
          align: 'left',
          style: {
            fontSize: '18px',
            fontWeight: 600,
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#1F2937'
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <DashboardLayout>
      <div className={`transition-all duration-500 ${animated ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 shadow-lg">
              <FaChartBar className="text-white text-xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
          </div>
          

        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtrar Relatórios</h2>
          
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm mb-1 text-gray-600 font-medium">
                <FaPhoneAlt className="inline mr-2 text-blue-500" /> Número
              </label>
              <select
                value={numeroSelecionado}
                onChange={(e) => setNumeroSelecionado(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Selecione um número</option>
                {workers.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm mb-1 text-gray-600 font-medium">
                <FaCalendarAlt className="inline mr-2 text-blue-500" /> Data Inicial
              </label>
              <DatePicker
                selected={dataInicial ? parse(dataInicial, 'yyyy-MM-dd', new Date()) : null}
                onChange={(date) => {
                  const localISO = date.toLocaleDateString('sv-SE');
                  setDataInicial(localISO);
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText="Selecione uma data"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm mb-1 text-gray-600 font-medium">
                <FaCalendarAlt className="inline mr-2 text-blue-500" /> Data Final
              </label>
              <DatePicker
                selected={dataFinal ? parse(dataFinal, 'yyyy-MM-dd', new Date()) : null}
                onChange={(date) => {
                  const localISO = date.toLocaleDateString('sv-SE');
                  setDataFinal(localISO);
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText="Selecione uma data"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <button
              onClick={buscarRelatorios}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  <span>Carregando...</span>
                </>
              ) : (
                <>
                  <FaSearch className="mr-2" /> Filtrar
                </>
              )}
            </button>

            {relatorios.length > 0 && (
              <button
                onClick={exportarExcel}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center"
              >
                <FaFileExcel className="mr-2" /> Exportar Excel
              </button>
            )}
          </div>

          {/* Resumo da filtragem */}
          {pesquisaRealizada && !loading && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 flex items-center">
              <FaFilter className="mr-2 text-blue-500" />
              <span>
                {(() => {
                  const hoje = new Date().toLocaleDateString('sv-SE');
                  const amanha = new Date();
                  amanha.setDate(amanha.getDate() + 1);
                  const amanhaFormatado = amanha.toLocaleDateString('sv-SE');
                  
                  // Verifica se é busca do dia atual (hoje até amanhã)
                  if (dataInicial === hoje && dataFinal === amanhaFormatado) {
                    return `Filtro aplicado: ${numeroSelecionado ? `Número: ${numeroSelecionado} • ` : ''}📅 Envios de hoje (${hoje})`;
                  }
                  
                  // Filtro normal
                  const parts = ['Filtro aplicado:'];
                  if (numeroSelecionado) parts.push(`Número: ${numeroSelecionado}`);
                  if (dataInicial) parts.push(`De: ${dataInicial}`);
                  if (dataFinal) parts.push(`Até: ${dataFinal}`);
                  if (!dataInicial && !dataFinal) parts.push('Todos os períodos');
                  
                  return parts.join(' • ');
                })()}
              </span>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center p-8 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            <p className="ml-3 text-gray-600 font-medium">Carregando relatórios...</p>
          </div>
        )}
        
        {erro && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 mb-6">
            <p className="font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {erro}
            </p>
          </div>
        )}

        {relatorios.length > 0 && (
          <div className="mb-8 bg-white p-6 rounded-xl shadow-md border border-gray-100 transition-all duration-300 hover:shadow-lg">
            <Chart
              options={prepararDadosGrafico().options}
              series={prepararDadosGrafico().series}
              type="bar"
              height={320}
            />
          </div>
        )}

        {!loading && relatorios.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center mb-4">
              <FaChartBar className="text-blue-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Histórico de Envios</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full table-auto text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Data Fila</th>
                      <th className="px-4 py-3 text-left font-semibold">Data Envio</th>
                      <th className="px-4 py-3 text-left font-semibold">De</th>
                      <th className="px-4 py-3 text-left font-semibold">Para</th>
                      <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Mensagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorios.map((item, i) => (
                      <tr key={i} className="border-t hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-2 text-gray-700">{formatDate(item.date_time_queue) || '-'}</td>
                        <td className="px-4 py-2 text-gray-700">{formatDate(item.date_time_send) || '-'}</td>
                        <td className="px-4 py-2 text-gray-700">{item.from_number}</td>
                        <td className="px-4 py-2 text-gray-700">{item.to_number}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.message_type === 'text' ? 'bg-blue-100 text-blue-800' : 
                            item.message_type === 'image' ? 'bg-purple-100 text-purple-800' : 
                            item.message_type === 'video' ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.message_type}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'sent' ? 'bg-green-100 text-green-800' : 
                            item.status === 'delivered' ? 'bg-blue-100 text-blue-800' : 
                            item.status === 'read' ? 'bg-indigo-100 text-indigo-800' : 
                            item.status === 'failed' ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 break-words max-w-[300px] text-gray-700">
                          {item.message?.length > 50 ? `${item.message.substring(0, 50)}...` : item.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="text-right mt-4 text-sm text-gray-500">
              Total de registros: {relatorios.length}
            </div>
          </div>
        )}

        {!loading && pesquisaRealizada && relatorios.length === 0 && (
          <div className="flex flex-col items-center justify-center bg-white p-12 rounded-xl shadow-md border border-gray-100">
            <FaExclamationCircle className="h-16 w-16 text-yellow-400 mb-4" />
            <h3 className="text-gray-800 text-xl font-medium mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-500 text-center max-w-md mb-2">
              Não foram encontrados envios para o número {numeroSelecionado} no período selecionado.
            </p>
            <p className="text-gray-400 text-sm text-center">
              {dataInicial && dataFinal 
                ? `Período pesquisado: ${dataInicial} até ${dataFinal}`
                : dataInicial 
                  ? `A partir de: ${dataInicial}` 
                  : dataFinal 
                    ? `Até: ${dataFinal}` 
                    : 'Nenhum período específico selecionado'}
            </p>
            <button 
              onClick={() => {
                setDataInicial('');
                setDataFinal('');
              }}
              className="mt-6 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center"
            >
              <FaCalendarAlt className="mr-2" />
              Limpar datas e tentar novamente
            </button>
          </div>
        )}

        {!loading && !pesquisaRealizada && (
          <div className="flex flex-col items-center justify-center bg-white p-12 rounded-xl shadow-md border border-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">Selecione os filtros para começar</p>
            <p className="text-gray-400 mt-2">Escolha um número e intervalo de datas para visualizar os relatórios.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
