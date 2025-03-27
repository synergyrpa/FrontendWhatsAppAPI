import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNumbers } from '../context/NumbersContext';

export default function QRCodePage() {
  const { workers, admins, numbersLoading, numbersErro } = useNumbers();
  const [numeroSelecionado, setNumeroSelecionado] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [conectado, setConectado] = useState(false);
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

  useEffect(() => {
    if (!numeroSelecionado) return;

    setErro('');
    setConectado(false);

    const urlBase = `https://users-wpp-websocket-context.s3.amazonaws.com/qrcodes/${numeroSelecionado}.png`;
    setQrCodeUrl(`${urlBase}?t=${Date.now()}`);

    const interval = setInterval(() => {
      setQrCodeUrl(`${urlBase}?t=${Date.now()}`);
      setErro('');
      setConectado(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [numeroSelecionado]);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Conectar WhatsApp</h1>

      <div className="space-y-4 max-w-md">
        <label className="block text-sm text-gray-600">Selecione o número:</label>
        <select
          value={numeroSelecionado}
          onChange={(e) => setNumeroSelecionado(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Selecione...</option>
          {workers.map((number, index) => (
            <option key={index} value={number}>
              {number}
            </option>
          ))}
        </select>
      </div>

      {qrCodeUrl && !conectado && (
        <div className="mt-8 flex justify-center">
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="w-64 h-64 border rounded-lg shadow-lg"
            onLoad={() => {
              setConectado(false);
              setErro('');
            }}
            onError={() => {
              setErro('');
              setConectado(true);
            }}
          />
        </div>
      )}

      {conectado && (
        <p className="text-green-600 mt-6 text-center font-semibold">
          ✅ Número já conectado ao WhatsApp
        </p>
      )}

      {erro && (
        <p className="text-red-500 mt-4 text-center">
          {erro}
        </p>
      )}
    </DashboardLayout>
  );
}
