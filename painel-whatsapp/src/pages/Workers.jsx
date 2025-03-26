import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [novoNumero, setNovoNumero] = useState('');
  const [editando, setEditando] = useState(null); // ID do worker em edição
  const [valorEditado, setValorEditado] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    // Carrega os números disponíveis
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:8000/api/v1/numbers`,{headers: {token: token}})
      .then((res) => {
        setWorkers(res.data.description.workers)
        console.log(res.data.description.workers);
      })
      .catch(() => setErro('Erro ao carregar números'));
    console.log(workers);
  }, []);

  const carregarWorkers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8000/api/v1/numbers`,{headers: {token: token}});
      setWorkers(res.data.description.workers);
    } catch (err) {
      setErro('Erro ao carregar os números');
    }
  };

  useEffect(() => {
    carregarWorkers();
  }, []);

  const adicionarNumero = async () => {
    if (!novoNumero) return;
    setLoading(true);
    setErro('');
    setSucesso('');

    try {
      await axios.post('http://sua-api.com/workers', { numero: novoNumero });
      setSucesso('Número adicionado com sucesso!');
      setNovoNumero('');
      carregarWorkers();
    } catch (err) {
      setErro('Erro ao adicionar número');
    } finally {
      setLoading(false);
    }
  };

  const removerNumero = async (id) => {
    if (!confirm('Tem certeza que deseja remover este número?')) return;

    try {
      await axios.delete(`http://sua-api.com/workers/${id}`);
      carregarWorkers();
    } catch (err) {
      alert('Erro ao remover número');
    }
  };

  const salvarEdicao = async (id) => {
    if (!valorEditado) return;
    try {
      await axios.put(`http://sua-api.com/workers/${id}`, {
        numero: valorEditado,
      });
      setEditando(null);
      setValorEditado('');
      carregarWorkers();
    } catch (err) {
      alert('Erro ao salvar edição');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Números</h1>

        <div className="max-w-md mb-6 space-y-4">
          <input
            type="text"
            placeholder="Digite o número com DDD (ex: 5511999999999)"
            value={novoNumero}
            onChange={(e) => setNovoNumero(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />
          <button
            onClick={adicionarNumero}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md"
          >
            {loading ? 'Adicionando...' : 'Adicionar Número'}
          </button>

          {erro && <p className="text-red-500">{erro}</p>}
          {sucesso && <p className="text-green-600">{sucesso}</p>}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Números cadastrados</h2>
          <ul className="divide-y divide-gray-200">
            {workers.map((w) => (
              <li key={w} className="py-2 flex justify-between items-center gap-4">
                {editando === w ? (
                  <>
                    <input
                      type="text"
                      value={valorEditado}
                      onChange={(e) => setValorEditado(e.target.value)}
                      className="flex-1 px-3 py-1 border rounded"
                    />
                    <button
                      onClick={() => salvarEdicao(w)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setEditando(null);
                        setValorEditado('');
                      }}
                      className="text-gray-500 text-sm"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-gray-700 flex-1">{w}</span>
                    <button
                      onClick={() => {
                        setEditando(w);
                        setValorEditado(w);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => removerNumero(w)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover
                    </button>
                  </>
                )}
              </li>
            ))}
            {workers.length === 0 && (
              <p className="text-gray-500 text-sm">Nenhum número cadastrado.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
