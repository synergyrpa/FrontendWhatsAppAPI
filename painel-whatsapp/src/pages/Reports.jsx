import { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Chart from 'react-apexcharts';
import DashboardLayout from '../layouts/DashboardLayout';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parse } from 'date-fns';
import { useNumbers } from '../context/NumbersContext';

const formatDateToYYYYMMDD = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date)) return '';
  return date.toISOString().split('T')[0]; // yyyy-mm-dd
};

export default function Reports() {
  const { workers, admins, numbersLoading, numbersErro } = useNumbers();
  const [relatorios, setRelatorios] = useState([]);
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [numeroSelecionado, setNumeroSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  // const [workers, setWorkers] = useState([]);

  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   axios
  //     .get(`http://localhost:8000/api/v1/numbers`, { headers: { token } })
  //     .then((res) => {
  //       setWorkers(res.data.description.workers);
  //     })
  //     .catch(() => setErro('Erro ao carregar números'));
  // }, []);

  const buscarRelatorios = async () => {
    if (!numeroSelecionado) {
      setErro('Selecione um número para visualizar os relatórios');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      console.log("Datas:",dataInicial, dataFinal);
      const response = await axios.get('http://localhost:8000/api/v1/sends-report', {
        headers: { token: localStorage.getItem('token') },
        params: {
          from_number: numeroSelecionado,
          init_time: dataInicial,
          end_time: dataFinal,
        },
      });
      setRelatorios(response.data.description);
    } catch (err) {
      setErro('Erro ao buscar relatórios');
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
      // Formatando data no padrão yyyy-mm-dd
      const data = new Date(item.date_time_send).toLocaleDateString('sv-SE');
      agrupado[data] = (agrupado[data] || 0) + 1;
    });
  
    // Ordenando as datas
    const categoriasOrdenadas = Object.keys(agrupado).sort();
    const valoresOrdenados = categoriasOrdenadas.map((data) => agrupado[data]);
  
    return {
      options: {
        chart: { id: 'mensagens-por-dia', toolbar: { show: false } },
        xaxis: { categories: categoriasOrdenadas },
        title: { text: 'Mensagens por Dia', align: 'left' },
        colors: ['#2563eb'],
      },
      series: [{ name: 'Mensagens', data: valoresOrdenados }],
    };
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Relatórios</h1>

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label className="block text-sm mb-1 text-gray-600">Número</label>
          <select
            value={numeroSelecionado}
            onChange={(e) => setNumeroSelecionado(e.target.value)}
            className="p-2 border rounded min-w-[200px]"
          >
            <option value="">Selecione um número</option>
            {workers.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-600">Data Inicial</label>
          <DatePicker
            selected={dataInicial ? parse(dataInicial, 'yyyy-MM-dd', new Date()) : null}
            onChange={(date) => {
              
              const localISO = date.toLocaleDateString('sv-SE');
              setDataInicial(localISO);
            }}
            dateFormat="yyyy-MM-dd"
            placeholderText="Selecione uma data"
            className="p-2 border rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-600">Data Final</label>
          <DatePicker
            selected={dataFinal ? parse(dataFinal, 'yyyy-MM-dd', new Date()) : null}
            onChange={(date) => {
              const localISO = date.toLocaleDateString('sv-SE');
              setDataFinal(localISO);
            }}
            dateFormat="yyyy-MM-dd"
            placeholderText="Selecione uma data"
            className="p-2 border rounded w-full"
          />
        </div>

        <button
          onClick={buscarRelatorios}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Filtrar
        </button>

        {relatorios.length > 0 && (
          <button
            onClick={exportarExcel}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Exportar Excel
          </button>
        )}
      </div>

      {loading && <p className="text-gray-600">Carregando relatórios...</p>}
      {erro && <p className="text-red-500">{erro}</p>}

      {relatorios.length > 0 && (
        <div className="mb-10 bg-white p-6 rounded shadow">
          <Chart
            options={prepararDadosGrafico().options}
            series={prepararDadosGrafico().series}
            type="bar"
            height={250}
          />
        </div>
      )}

      {!loading && relatorios.length > 0 && (
        <div className="mt-10 bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Histórico de Envios</h2>
          <div className="overflow-y-auto max-h-[300px] rounded border">
            <table className="w-full table-auto text-sm text-gray-700">
              <thead className="bg-blue-100 text-gray-800 text-xs sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left">Data Fila</th>
                  <th className="px-3 py-2 text-left">Data Envio</th>
                  <th className="px-3 py-2 text-left">De</th>
                  <th className="px-3 py-2 text-left">Para</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {relatorios.map((item, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-1">{item.date_time_queue || '-'}</td>
                    <td className="px-3 py-1">{item.date_time_send || '-'}</td>
                    <td className="px-3 py-1">{item.from_number}</td>
                    <td className="px-3 py-1">{item.to_number}</td>
                    <td className="px-3 py-1">{item.message_type}</td>
                    <td className="px-3 py-1">{item.status}</td>
                    <td className="px-3 py-1 break-words max-w-[300px]">{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && relatorios.length === 0 && (
        <p className="text-gray-500 mt-4">Nenhum relatório encontrado.</p>
      )}
    </DashboardLayout>
  );
}
