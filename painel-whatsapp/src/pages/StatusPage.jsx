import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNumbers } from '../context/NumbersContext';

export default function StatusPage() {
  const { workers } = useNumbers();
  const [statusData, setStatusData] = useState({});

  const fetchStatus = async () => {
    const token = localStorage.getItem('token');
    const newStatus = {};

    await Promise.all(
      workers.map(async (number) => {
        try {
          const res = await axios.get(`https://api.synergyrpa.com/api/v1/number-status?number=${number}`, {
            headers: { token },
          });
          newStatus[number] = {
            status: res.data.description,
            time: new Date().toLocaleString('pt-BR'),
          };
        } catch {
          newStatus[number] = {
            status: 'erro',
            time: new Date().toLocaleString('pt-BR'),
          };
        }
      })
    );

    setStatusData(newStatus);
  };

  useEffect(() => {
    if (workers.length === 0) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // atualiza a cada 10s
    return () => clearInterval(interval);
  }, [workers]);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Status dos Workers</h1>
      <div className="overflow-x-auto bg-white rounded shadow p-4">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-blue-100 text-gray-700">
            <tr>
              <th className="px-4 py-2">Número</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Última Verificação</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((number) => {
              const data = statusData[number];
              return (
                <tr key={number} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{number}</td>
                  <td className="px-4 py-2">
                    {data?.status === 'conectado' && <span className="text-green-600 font-semibold">🟢 Conectado</span>}
                    {data?.status === 'desconectado' && <span className="text-red-600 font-semibold">🔴 Desconectado</span>}
                    {data?.status === 'erro' && <span className="text-yellow-600 font-semibold">⚠️ Erro</span>}
                    {!data && <span className="text-gray-500">Carregando...</span>}
                  </td>
                  <td className="px-4 py-2">{data?.time || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
