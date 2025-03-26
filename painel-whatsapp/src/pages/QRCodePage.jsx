import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

export default function QRCodePage() {
  const [workers, setWorkers] = useState([]);
  const [numeroSelecionado, setNumeroSelecionado] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

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

  // Atualiza o QRCode a cada 10s
  useEffect(() => {
    if (!numeroSelecionado) return;

    const url = `https://users-wpp-websocket-context.s3.amazonaws.com/qrcodes/${numeroSelecionado}.png`;
    setQrCodeUrl(`${url}?t=${Date.now()}`); // Força reload a cada render

    const interval = setInterval(() => {
      setQrCodeUrl(`${url}?t=${Date.now()}`);
    }, 5000);

    return () => clearInterval(interval); // limpa o intervalo ao trocar número
  }, [numeroSelecionado]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-10">
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

        {qrCodeUrl && (
          <div className="mt-8 flex justify-center">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-64 h-64 border rounded-lg shadow-lg"
              onError={() => setErro('QR Code não encontrado ou expirado')}
            />
          </div>
        )}

        {erro && <p className="text-red-500 mt-4 text-center">{erro}</p>}
      </div>
    </div>
  );
}
