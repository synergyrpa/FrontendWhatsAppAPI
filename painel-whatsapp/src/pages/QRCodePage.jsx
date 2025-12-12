import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNumbers } from '../context/NumbersContext';
import { FaQrcode, FaSync, FaCheck, FaExclamationTriangle, FaMobile, FaWhatsapp } from 'react-icons/fa';

export default function QRCodePage() {
  const { workers } = useNumbers();
  const params = useParams();
  const [numeroSelecionado, setNumeroSelecionado] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [conectado, setConectado] = useState(false);
  const [erro, setErro] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [animated, setAnimated] = useState(false);
  const QR_POLL_INTERVAL_MS = Number(import.meta.env.VITE_QR_POLL_INTERVAL_MS) || 5000;
  const pollSeconds = Math.round(QR_POLL_INTERVAL_MS / 1000);
  const qrCodeRef = useRef('');

  const updateQrCode = useCallback((value) => {
    setQrCodeUrl(value);
    qrCodeRef.current = value;
  }, []);

  useEffect(() => {
    setAnimated(true);
    // Se vier um número como parâmetro da URL, use-o
    if (params.number && workers.includes(params.number)) {
      setNumeroSelecionado(params.number);
    } else if (workers.length > 0) {
      // Se não tiver parâmetro mas tiver workers, selecione o primeiro
      setNumeroSelecionado(workers[0]);
    }
  }, [params, workers]);

  const loadStatusWorker = useCallback(async (number) => {
    if (!number) return;
    
    setStatusLoading(true);
    try {
      console.log('📱 QRCode: Verificando status para número:', number);
      const res = await apiClient.get('/api/v2/numbers/status', {
        params: { number }
      });

      setConectado(res.data.description.status === 'conectado');
      setErro('');
      console.log('✅ QRCode: Status carregado:', res.data.description.status);
    } catch (err) {
      console.error('Erro ao verificar status:', err);
      setErro('Erro ao verificar o status do número');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const fetchQrCode = useCallback(async (number, { forceLoader = false } = {}) => {
    if (!number) return;

    const hadQrBefore = Boolean(qrCodeRef.current);
    const shouldShowLoader = forceLoader || !hadQrBefore;

    if (shouldShowLoader) {
      setQrLoading(true);
    }

    try {
      const res = await apiClient.get('/api/v2/numbers/connect', {
        params: { number }
      });

      if (res.status !== 200) {
        console.error('⚠️ QRCode: API retornou status inesperado', {
          status: res.status,
          data: res.data
        });

        if (!hadQrBefore || forceLoader) {
          updateQrCode('');
          setErro('Não foi possível gerar o QR Code. Tente novamente.');
        }
        return;
      }

      const qrBase64 = res.data?.description?.qr_base64?.trim();

      if (qrBase64) {
        updateQrCode(qrBase64);
        setConectado(false);
        setErro('');
      } else {
        console.info('ℹ️ QRCode: Campo qr_base64 vazio, considerando número já conectado.');
        updateQrCode('');
        setConectado(true);
        setErro('');
      }
    } catch (err) {
      console.error('Erro ao buscar QR Code via API:', err);

      if (!hadQrBefore || forceLoader) {
        updateQrCode('');
        setErro('Erro ao gerar QR Code');
      }
    } finally {
      if (shouldShowLoader) {
        setQrLoading(false);
      }
    }
  }, [updateQrCode]);

  // Dispara quando um número é selecionado
  useEffect(() => {
    if (!numeroSelecionado) return;

    setErro('');
    setConectado(false);
    updateQrCode('');

    loadStatusWorker(numeroSelecionado);
    fetchQrCode(numeroSelecionado, { forceLoader: true });

    const interval = setInterval(() => {
      loadStatusWorker(numeroSelecionado);
      fetchQrCode(numeroSelecionado);
    }, QR_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [numeroSelecionado, QR_POLL_INTERVAL_MS, loadStatusWorker, fetchQrCode, updateQrCode]);

  const handleRefresh = () => {
    if (!numeroSelecionado) return;
    setErro('');
    fetchQrCode(numeroSelecionado, { forceLoader: true });
    loadStatusWorker(numeroSelecionado);
  };

  const formatPhoneNumber = (number) => {
    if (!number) return '';
    
    // Supondo que o formato seja: 55 11 99999-9999
    if (number.length >= 13) {
      const country = number.substring(0, 2);
      const area = number.substring(2, 4);
      const firstPart = number.substring(4, 9);
      const lastPart = number.substring(9);
      return `+${country} (${area}) ${firstPart}-${lastPart}`;
    }
    
    return number;
  };

  return (
    <DashboardLayout>
      <div className={`transition-all duration-500 ${animated ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center mb-8">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 shadow-lg">
            <FaQrcode className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Conectar WhatsApp</h1>
            <p className="text-gray-600 text-sm">Escaneie o QR Code para conectar seu dispositivo</p>
          </div>
        </div>

        {/* Seleção de número */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="space-y-2 flex-grow md:max-w-md">
              <label className="block text-sm font-medium text-gray-700">Selecione o número de WhatsApp:</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMobile className="text-gray-400" />
                </div>
                <select
                  value={numeroSelecionado}
                  onChange={(e) => setNumeroSelecionado(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all appearance-none bg-white"
                >
                  <option value="">Selecione um número...</option>
                  {workers.map((number, index) => (
                    <option key={index} value={number}>
                      {formatPhoneNumber(number)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={qrLoading || statusLoading || !numeroSelecionado}
              className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSync className={`mr-2 ${qrLoading ? 'animate-spin' : ''}`} />
              Atualizar QR Code
            </button>
          </div>
        </div>

        {/* Área do QR Code */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 text-center">
          {!numeroSelecionado ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-100 p-6 rounded-full mb-4">
                <FaQrcode className="text-gray-400 text-5xl" />
              </div>
              <p className="text-gray-500">Selecione um número para exibir o QR Code</p>
            </div>
          ) : conectado ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-green-100 p-6 rounded-full mb-4">
                <FaCheck className="text-green-500 text-5xl" />
              </div>
              <h2 className="text-xl font-bold text-green-600 mb-2">Dispositivo Conectado!</h2>
              <p className="text-gray-600 max-w-md">
                O número {formatPhoneNumber(numeroSelecionado)} já está conectado ao WhatsApp e pronto para uso.
              </p>
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center"
                >
                  <FaSync className="mr-2" />
                  Verificar novamente
                </button>
              </div>
            </div>
          ) : qrLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent"></div>
              </div>
              <p className="text-gray-600">Carregando QR Code...</p>
            </div>
          ) : erro ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-red-100 p-6 rounded-full mb-4">
                <FaExclamationTriangle className="text-red-500 text-5xl" />
              </div>
              <h2 className="text-xl font-bold text-red-600 mb-2">Erro ao carregar QR Code</h2>
              <p className="text-gray-600 max-w-md mb-6">{erro}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center"
              >
                <FaSync className="mr-2" />
                Tentar novamente
              </button>
            </div>
          ) : (
            <div>
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code para WhatsApp"
                    className="w-72 h-72 rounded-lg border-4 border-green-100 shadow-lg"
                    onError={() => {
                      updateQrCode('');
                      setErro('QR Code não encontrado ou expirado');
                    }}
                  />
                  <div className="absolute -bottom-3 -right-3 bg-white p-1.5 rounded-full border-2 border-green-400 shadow-md">
                    <FaWhatsapp className="text-green-500 text-2xl" />
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">Como conectar:</h3>
              <ol className="text-left max-w-md mx-auto space-y-3 text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center font-medium mr-2 flex-shrink-0">1</span>
                  <span>Abra o WhatsApp no seu celular</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center font-medium mr-2 flex-shrink-0">2</span>
                  <span>Toque em Menu ou Configurações e selecione "Aparelhos vinculados"</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center font-medium mr-2 flex-shrink-0">3</span>
                  <span>Toque em "Vincular um aparelho"</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center font-medium mr-2 flex-shrink-0">4</span>
                  <span>Aponte a câmera do seu celular para este QR Code</span>
                </li>
              </ol>
              
              <p className="text-sm text-gray-500 italic">
                O QR Code será atualizado automaticamente a cada {pollSeconds} segundos
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
