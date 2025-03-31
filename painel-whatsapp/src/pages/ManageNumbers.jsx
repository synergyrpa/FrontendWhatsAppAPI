import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNumbers } from '../context/NumbersContext';

export default function ManageNumbers() {
  const { workers, admins, refreshNumbers } = useNumbers();
  const [tipoSelecionado, setTipoSelecionado] = useState('workers');
  const [novoNumero, setNovoNumero] = useState('');
  const [sucesso, setSucesso] = useState('');
  const token = localStorage.getItem('token');
  const [erro, setErro] = useState('');
  
  // const [workers, setWorkers] = useState([]);
  // const [admins, setAdmins] = useState([]);
  // const carregarNumeros = async () => {
  //   try {
  //     const response = await axios.get('https://api.synergyrpa.com/api/v1/numbers', {
  //       headers: { token },
  //     });
  //     setWorkers(response.data.description.workers || []);
  //     setAdmins(response.data.description.admins || []);
  //   } catch {
  //     setErro('Erro ao carregar os números');
  //   }
  // };

  // useEffect(() => {
  //   carregarNumeros();
  // }, []);

  const handleAdicionar = async () => {
    setErro('');
    setSucesso('');

    if (!novoNumero) {
      setErro('Informe o número com DDD e DDI');
      return;
    }

    try {
      await axios.post(
        'https://api.synergyrpa.com/api/v1/number',
        { number: novoNumero, role: tipoSelecionado },
        { headers: { token } }
      );
      setSucesso('Número adicionado com sucesso!');
      setNovoNumero('');
      refreshNumbers();
    } catch (error) {
      setErro('Erro ao adicionar número');
      console.error('Erro ao adicionar número:', error); // 👈
    }
  };

  const handleRemover = async (number) => {
    setErro('');
    setSucesso('');

    try {
      await axios.delete('https://api.synergyrpa.com/api/v1/number', {
        headers: { token },
        data: { number, role: tipoSelecionado },
      });
      setSucesso('Número removido com sucesso!');
      refreshNumbers();
    } catch (error) {
      setErro('Erro ao remover número');
      console.error('Erro ao remover número:', error); // 👈
    }
  };

  const lista = tipoSelecionado === 'workers' ? workers : admins;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Números</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTipoSelecionado('workers')}
          className={`px-4 py-2 rounded ${
            tipoSelecionado === 'workers'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Workers
        </button>
        <button
          onClick={() => setTipoSelecionado('admins')}
          className={`px-4 py-2 rounded ${
            tipoSelecionado === 'admins'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Admins
        </button>
      </div>

      {/* Formulário adicionar */}
      <div className="flex items-end gap-4 mb-4">
        <div>
          <label className="text-sm block mb-1 text-gray-600">
            Novo número ({tipoSelecionado})
          </label>
          <input
            type="text"
            value={novoNumero}
            onChange={(e) => setNovoNumero(e.target.value)}
            className="p-2 border rounded w-full"
            placeholder="Ex: 5511999999999"
          />
        </div>
        <button
          onClick={handleAdicionar}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Adicionar
        </button>
      </div>

      {erro && <p className="text-red-500 mb-2">{erro}</p>}
      {sucesso && <p className="text-green-600 mb-2">{sucesso}</p>}

      {/* Lista de números */}
      <div className="bg-white p-4 rounded shadow max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {tipoSelecionado === 'workers'
            ? 'Workers Cadastrados'
            : 'Admins Cadastrados'}
        </h2>
        <ul className="space-y-2">
          {lista.length === 0 && (
            <p className="text-gray-500">Nenhum número cadastrado.</p>
          )}
          {lista.map((numero, i) => (
            <li
              key={i}
              className="flex items-center justify-between border-b pb-2 text-sm"
            >
              <span>{numero}</span>
              <button
                onClick={() => handleRemover(numero)}
                className="text-red-600 hover:underline text-xs"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
}
