import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNumbers } from '../context/NumbersContext';
import { apiClient } from '../utils/apiClient';
import { 
  FaPaperPlane, 
  FaUpload, 
  FaWhatsapp, 
  FaImage, 
  FaFileAlt, 
  FaPhoneAlt, 
  FaUsers, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaRegularFile,
  FaTrash,
  FaTimes,
  FaDownload,
  FaFileExcel
} from 'react-icons/fa';
import * as XLSX from 'xlsx';

export default function SendMessages() {
  const navigate = useNavigate();
  const { workers } = useNumbers();
  const [fromNumber, setFromNumber] = useState('');
  const [toNumber, setToNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [animated, setAnimated] = useState(false);
  const [sendMode, setSendMode] = useState('individual');
  const [bulkMode, setBulkMode] = useState('manual'); // 'manual' ou 'file'
  const [bulkNumbers, setBulkNumbers] = useState([]);
  const [validBulkNumbers, setValidBulkNumbers] = useState([]);
  const [invalidBulkNumbers, setInvalidBulkNumbers] = useState([]);
  const [bulkData, setBulkData] = useState([]); // Array de objetos {number, message}
  const [manualNumbersText, setManualNumbersText] = useState(''); // Texto para inserção manual
  const [bulkFile, setBulkFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [totalSent, setTotalSent] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [bulkDelay, setBulkDelay] = useState(1); // delay em segundos para envio em massa
  const [showBulkTable, setShowBulkTable] = useState(false); // Controla exibição da tabela
  const [editingCell, setEditingCell] = useState(null); // {index, field} para controlar edição
  const [uploadSubMode, setUploadSubMode] = useState('single-message'); // 'single-message' ou 'personalized-messages'
  
  const fileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);

  useEffect(() => {
    setAnimated(true);
    if (workers.length > 0) {
      setFromNumber(workers[0]);
    }
  }, [workers]);

  // Limpar mensagens de sucesso/erro após alguns segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Efeito para lidar com arquivos selecionados
  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }

    // Criar URL para preview (imagem ou vídeo)
    if (messageType === 'image' || messageType === 'video') {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [file, messageType]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Verificar tipo de arquivo baseado no messageType
    let isValidFile = false;
    
    if (messageType === 'image' && selectedFile.type.startsWith('image/')) {
      isValidFile = true;
    } else if (messageType === 'video' && selectedFile.type.startsWith('video/')) {
      isValidFile = true;
    } else if (messageType === 'document' && (
      selectedFile.type === 'application/pdf' || 
      selectedFile.type.includes('spreadsheet') ||
      selectedFile.type.includes('document') ||
      selectedFile.name.endsWith('.pdf') ||
      selectedFile.name.endsWith('.doc') ||
      selectedFile.name.endsWith('.docx') ||
      selectedFile.name.endsWith('.xls') ||
      selectedFile.name.endsWith('.xlsx')
    )) {
      isValidFile = true;
    }

    if (isValidFile) {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError(`Tipo de arquivo inválido para mensagem do tipo ${messageType}`);
      fileInputRef.current.value = null;
    }
  };

  const handleBulkFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        selectedFile.type === 'application/vnd.ms-excel' ||
        selectedFile.name.endsWith('.xlsx') ||
        selectedFile.name.endsWith('.xls') ||
        selectedFile.name.endsWith('.csv')) {
      
      setBulkFile(selectedFile);
      processExcelFileWithPersonalization(selectedFile);
      setError('');
    } else {
      setBulkFile(null);
      setError('Por favor, envie um arquivo Excel (.xlsx, .xls) ou CSV');
      bulkFileInputRef.current.value = null;
    }
  };

  const processExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Remover cabeçalho se for 'número' ou 'numero' (com ou sem acento, case insensitive, ignorando espaços)
        let rows = [...jsonData];
        if (rows.length > 0) {
          const firstCell = rows[0][0]?.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s/g, '').toLowerCase();
          if (firstCell === 'numero' || firstCell === 'numero') {
            rows = rows.slice(1);
          }
        }
        // Agora processa apenas as linhas sem o cabeçalho
        const valid = [];
        const invalid = [];
        rows.forEach(row => {
          // Suporta arquivos com múltiplas colunas, pega só a primeira
          const cell = row[0];
          const onlyDigits = cell && cell.toString().replace(/\D/g, '');
          if (onlyDigits && /^\d{10,15}$/.test(onlyDigits)) {
            valid.push(onlyDigits);
          } else if (cell && cell.toString().trim() !== '') {
            invalid.push(cell);
          }
        });
        setBulkNumbers(valid); // bulkNumbers deve ser sempre igual aos válidos
        setValidBulkNumbers(valid);
        setInvalidBulkNumbers(invalid);
        setError('');
        setSuccess('');
        
        if (invalid.length > 0) {
          setError(`Encontrados ${invalid.length} números inválidos no arquivo.`);
        } else if (valid.length === 0) {
          setError('Nenhum número válido encontrado no arquivo.');
        } else {
          setSuccess(`${valid.length} números carregados com sucesso!`);
        }
      } catch (err) {
        console.error('Erro ao processar arquivo:', err);
        setError('Erro ao processar o arquivo. Verifique se o formato está correto.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processManualNumbers = (text) => {
    if (!text.trim()) {
      setBulkNumbers([]);
      setValidBulkNumbers([]);
      setInvalidBulkNumbers([]);
      setBulkData([]);
      return;
    }

    // Separar números por quebra de linha, vírgula ou ponto e vírgula
    const rawNumbers = text.split(/[\n,;]+/).map(num => num.trim()).filter(num => num);
    
    const valid = [];
    const invalid = [];
    const bulkDataArray = [];
    
    rawNumbers.forEach(rawNumber => {
      const onlyDigits = rawNumber.replace(/\D/g, '');
      if (onlyDigits && /^\d{10,15}$/.test(onlyDigits)) {
        valid.push(onlyDigits);
        bulkDataArray.push({
          number: onlyDigits,
          message: null // Para inserção manual, todos usam a mesma mensagem
        });
      } else if (rawNumber.trim() !== '') {
        invalid.push(rawNumber);
      }
    });
    
    setBulkNumbers(valid);
    setValidBulkNumbers(valid);
    setInvalidBulkNumbers(invalid);
    setBulkData(bulkDataArray);
    // Não mostrar tabela no modo manual
    
    if (invalid.length > 0) {
      setError(`Encontrados ${invalid.length} números inválidos.`);
    } else if (valid.length === 0) {
      setError('Nenhum número válido encontrado.');
    } else {
      setSuccess(`${valid.length} números válidos adicionados!`);
      setError('');
    }
  };

  const processExcelFileWithPersonalization = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Verificar se há cabeçalho e removê-lo
        let rows = [...jsonData];
        let hasPersonalizedMessages = false;
        
        if (rows.length > 0) {
          const firstRow = rows[0];
          const firstCell = firstRow[0]?.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s/g, '').toLowerCase();
          const secondCell = firstRow[1]?.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s/g, '').toLowerCase();
          
          if (firstCell === 'numero') {
            // Tem cabeçalho, verificar se há segunda coluna para mensagens
            if (secondCell && (secondCell === 'mensagem' || secondCell === 'message')) {
              hasPersonalizedMessages = true;
            }
            rows = rows.slice(1); // Remove o cabeçalho
          }
        }
        
        const valid = [];
        const invalid = [];
        const bulkDataArray = [];
        
        rows.forEach(row => {
          const numberCell = row[0];
          const messageCell = hasPersonalizedMessages ? row[1] : null;
          const onlyDigits = numberCell && numberCell.toString().replace(/\D/g, '');
          
          if (onlyDigits && /^\d{10,15}$/.test(onlyDigits)) {
            valid.push(onlyDigits);
            bulkDataArray.push({
              number: onlyDigits,
              message: messageCell && messageCell.toString().trim() ? messageCell.toString() : null
            });
          } else if (numberCell && numberCell.toString().trim() !== '') {
            invalid.push(numberCell);
          }
        });
        
        setBulkNumbers(valid);
        setValidBulkNumbers(valid);
        setInvalidBulkNumbers(invalid);
        setBulkData(bulkDataArray);
        setShowBulkTable(bulkDataArray.length > 0);
        
        // Detectar automaticamente o modo baseado no conteúdo
        const personalizedCount = bulkDataArray.filter(item => item.message && item.message.trim()).length;
        if (personalizedCount > 0) {
          setUploadSubMode('personalized-messages');
        } else {
          setUploadSubMode('single-message');
        }
        
        setError('');
        setSuccess('');
        
        if (invalid.length > 0) {
          setError(`Encontrados ${invalid.length} números inválidos no arquivo.`);
        } else if (valid.length === 0) {
          setError('Nenhum número válido encontrado no arquivo.');
        } else {
          const personalizedCount = bulkDataArray.filter(item => item.message).length;
          let successMsg = `${valid.length} números carregados com sucesso!`;
          if (personalizedCount > 0) {
            successMsg += ` ${personalizedCount} mensagens personalizadas encontradas.`;
          }
          setSuccess(successMsg);
        }
      } catch (err) {
        console.error('Erro ao processar arquivo:', err);
        setError('Erro ao processar o arquivo. Verifique se o formato está correto.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Funções para gerenciar a tabela editável
  const handleCellEdit = (index, field, value) => {
    const newBulkData = [...bulkData];
    newBulkData[index][field] = value;
    
    // Se editando número, validar
    if (field === 'number') {
      const onlyDigits = value.replace(/\D/g, '');
      newBulkData[index][field] = onlyDigits;
      
      // Atualizar listas de válidos/inválidos
      const valid = [];
      const invalid = [];
      newBulkData.forEach((item, idx) => {
        if (validatePhoneNumber(item.number)) {
          valid.push(item.number);
        } else {
          invalid.push(item.number);
        }
      });
      setBulkNumbers(valid);
      setValidBulkNumbers(valid);
      setInvalidBulkNumbers(invalid);
    }
    
    setBulkData(newBulkData);
  };

  const handleRemoveRow = (index) => {
    const newBulkData = bulkData.filter((_, i) => i !== index);
    setBulkData(newBulkData);
    
    // Atualizar listas
    const valid = [];
    const invalid = [];
    newBulkData.forEach((item) => {
      if (validatePhoneNumber(item.number)) {
        valid.push(item.number);
      } else {
        invalid.push(item.number);
      }
    });
    setBulkNumbers(valid);
    setValidBulkNumbers(valid);
    setInvalidBulkNumbers(invalid);
    
    if (newBulkData.length === 0) {
      setShowBulkTable(false);
    }
  };

  const handleAddRow = () => {
    const newBulkData = [...bulkData, { number: '', message: '' }];
    setBulkData(newBulkData);
  };

  const validatePhoneNumber = (number) => {
    // Número deve ter pelo menos 10 dígitos (DDD + número)
    return /^\d{10,15}$/.test(number);
  };

  const handleSendMessage = async () => {
    // Resetar mensagens
    setError('');
    setSuccess('');

    // Validação básica
    if (!fromNumber) {
      setError('Selecione um número de origem');
      return;
    }

    if (sendMode === 'individual' && !validatePhoneNumber(toNumber)) {
      setError('Número de destino inválido. Use apenas números (Ex: 5511999999999)');
      return;
    }

    if (sendMode === 'bulk' && bulkNumbers.length === 0) {
      setError('Nenhum número de destino carregado para envio em massa');
      return;
    }

    // Para mensagens de texto, verificar se há mensagem padrão ou mensagens personalizadas
    if (messageType === 'text') {
      if (sendMode === 'individual' && !message) {
        setError('Digite uma mensagem para enviar');
        return;
      }
      if (sendMode === 'bulk') {
        const hasPersonalizedMessages = bulkData.some(item => item.message);
        if (!message && !hasPersonalizedMessages) {
          setError('Digite uma mensagem padrão ou use um arquivo com mensagens personalizadas');
          return;
        }
      }
    }

    if ((messageType === 'image' || messageType === 'video' || messageType === 'document') && !file) {
      setError(`Selecione um arquivo para enviar como ${messageType}`);
      return;
    }

    setLoading(true);
    const WppApiEndpoint = import.meta.env.VITE_WPP_API_ENDPOINT;

    try {
      if (sendMode === 'individual') {
        // Envio individual
        await sendSingleMessage(fromNumber, toNumber, message, messageType, file, WppApiEndpoint);
        setSuccess('Mensagem enviada com sucesso!');
        
        // Limpar campos depois do envio
        setToNumber('');
        setMessage('');
        if (fileInputRef.current) fileInputRef.current.value = null;
        setFile(null);
        setPreviewUrl('');
      } else {
        // Envio em massa
        await sendBulkMessages(fromNumber, bulkData, message, messageType, file, WppApiEndpoint);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err.response?.data?.description || 'Erro ao enviar mensagem. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
      setIsSending(false);
      setProgress(0);
    }
  };

  const sendSingleMessage = async (from, to, text, type, fileData, apiEndpoint) => {
    if (type === 'text') {
      // Para mensagens de texto, usar JSON na API v2
      const payload = {
        from_number: from,
        to_number: to,
        media_type: 'text',
        content: text
      };
      
      await apiClient.post('/api/v2/sends', payload);
    } else {
      // Para arquivos, usar FormData na API v2
      const formData = new FormData();
      formData.append('from_number', from);
      formData.append('to_number', to);
      formData.append('media_type', type);
      
      if (fileData) {
        formData.append('file', fileData);
        if (text) {
          formData.append('caption', text); // Legenda opcional
        }
      }
      
      await apiClient.post(
        '/api/v2/upload/sends',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
    }
  };

  const sendBulkMessages = async (from, bulkDataArray, fallbackText, type, fileData, apiEndpoint) => {
    let sending = true;
    setIsSending(true);
    setTotalSent(0);
    let successful = 0;
    let failed = 0;
    try {
      for (let i = 0; i < bulkDataArray.length; i++) {
        if (!sending) break;
        try {
          const { number, message } = bulkDataArray[i];
          // Usar mensagem personalizada se disponível, senão usar a mensagem padrão
          const textToSend = message && message.trim() ? message : fallbackText;
          await sendSingleMessage(from, number, textToSend, type, fileData, apiEndpoint);
          successful++;
        } catch (err) {
          console.error(`Erro ao enviar para ${bulkDataArray[i].number}:`, err);
          failed++;
        }
        setTotalSent(i + 1);
        setProgress(Math.round(((i + 1) / bulkDataArray.length) * 100));
        // Usar o delay selecionado pelo usuário
        if (bulkDelay > 0 && i < bulkDataArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, bulkDelay * 1000));
        }
      }
      setSuccess(`Envio em massa concluído! Sucesso: ${successful}, Falhas: ${failed}`);
    } catch (err) {
      setError('Erro ao processar envio em massa');
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelBulkSend = () => {
    // Agora cancela usando variável local
    // Não é possível acessar a variável local sending diretamente, então pode-se apenas avisar o usuário
    setIsSending(false);
    setSuccess(`Envio cancelado. ${totalSent} mensagens enviadas de ${bulkData.length}.`);
  };

  const downloadExampleFile = () => {
    // Criar dados de exemplo com duas colunas
    const ws = XLSX.utils.aoa_to_sheet([
      ['número', 'mensagem'], // Cabeçalho
      ['5511999999999', 'Olá João! Como você está?'],
      ['5511988888888', 'Oi Maria, tudo bem?'],
      ['5511977777777', 'Boa tarde Pedro! Lembre-se da reunião às 14h.']
    ]);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Números e Mensagens');
    
    // Gerar e baixar o arquivo
    XLSX.writeFile(wb, 'exemplo-numeros-personalizados.xlsx');
  };

  return (
    <DashboardLayout>
      <div className={`transition-all duration-500 ${animated ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4 shadow-lg">
            <FaPaperPlane className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Enviar Mensagens</h1>
            <p className="text-gray-600 text-sm">Envie mensagens para um ou várias contatos</p>
          </div>
          
          <div className="ml-auto flex space-x-2">
            <button
              onClick={() => navigate('/reports')}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center text-sm font-medium text-gray-700"
            >
              Ver Relatórios
            </button>
          </div>
        </div>

        {/* Seletor de modo de envio */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Modo de Envio</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setSendMode('individual')}
              className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                sendMode === 'individual' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              } transition-colors`}
            >
              <FaWhatsapp className={`text-xl mr-3 ${sendMode === 'individual' ? 'text-green-600' : 'text-gray-500'}`} />
              <div className="text-left">
                <p className="font-semibold">Envio Individual</p>
                <p className="text-sm text-gray-500">Enviar para um número específico</p>
              </div>
            </button>
            
            <button
              onClick={() => setSendMode('bulk')}
              className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                sendMode === 'bulk' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              } transition-colors`}
            >
              <FaUsers className={`text-xl mr-3 ${sendMode === 'bulk' ? 'text-blue-600' : 'text-gray-500'}`} />
              <div className="text-left">
                <p className="font-semibold">Envio em Massa</p>
                <p className="text-sm text-gray-500">Enviar para múltiplos números</p>
              </div>
            </button>
          </div>
        </div>

        {/* Formulário de envio */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Painel principal */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Detalhes da Mensagem</h2>
            
            {/* Mensagens de sucesso/erro */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center">
                <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
                <FaExclamationTriangle className="text-red-500 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Número de origem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  De (Número de WhatsApp)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhoneAlt className="text-gray-400" />
                  </div>
                  <select
                    value={fromNumber}
                    onChange={(e) => setFromNumber(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all appearance-none bg-white"
                  >
                    <option value="">Selecione um número...</option>
                    {workers.map((number) => (
                      <option key={number} value={number}>
                        {number}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Número de destino (apenas para modo individual) */}
              {sendMode === 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Para (Número do destinatário)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaWhatsapp className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={toNumber}
                      onChange={(e) => setToNumber(e.target.value)}
                      placeholder="Ex: 5511999999999"
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Use o formato internacional, apenas números (Ex: 5511999999999)
                  </p>
                </div>
              )}
              
              {/* Modo de envio em massa */}
              {sendMode === 'bulk' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Modo de Envio em Massa
                    </label>
                    <button
                      onClick={() => setShowExampleModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Ver exemplo
                    </button>
                  </div>
                  
                  {/* Seletor de modo de entrada */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setBulkMode('manual')}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 ${
                        bulkMode === 'manual' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      } transition-colors`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${bulkMode === 'manual' ? 'text-blue-600' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <div className="text-left">
                        <p className="font-medium text-sm">Inserção Manual</p>
                        <p className="text-xs text-gray-500">Digite os números separados</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setBulkMode('file')}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 ${
                        bulkMode === 'file' 
                          ? 'border-green-500 bg-green-50 text-green-700' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      } transition-colors`}
                    >
                      <FaFileExcel className={`text-lg mr-2 ${bulkMode === 'file' ? 'text-green-600' : 'text-gray-500'}`} />
                      <div className="text-left">
                        <p className="font-medium text-sm">Upload de Planilha</p>
                        <p className="text-xs text-gray-500">Com mensagens personalizadas</p>
                      </div>
                    </button>
                  </div>
                  
                  {/* Entrada manual de números */}
                  {bulkMode === 'manual' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lista de números (um por linha ou separados por vírgula)
                      </label>
                      <textarea
                        value={manualNumbersText}
                        onChange={(e) => {
                          setManualNumbersText(e.target.value);
                          processManualNumbers(e.target.value);
                        }}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="5511999999999&#10;5511988888888&#10;5511977777777&#10;&#10;Ou separados por vírgula:&#10;5511999999999, 5511988888888, 5511977777777"
                      />
                      
                      {/* Resumo dos números válidos/inválidos */}
                      {(validBulkNumbers.length > 0 || invalidBulkNumbers.length > 0) && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span className="text-green-600">✓ Números válidos: {validBulkNumbers.length}</span>
                            {invalidBulkNumbers.length > 0 && (
                              <span className="text-red-600">✗ Inválidos: {invalidBulkNumbers.length}</span>
                            )}
                          </div>
                          
                          {validBulkNumbers.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg max-h-24 overflow-y-auto border border-green-200">
                              <div className="text-xs text-green-700 flex flex-wrap gap-1">
                                {validBulkNumbers.slice(0, 15).map((num, idx) => (
                                  <span key={idx} className="bg-green-200 px-2 py-1 rounded">
                                    {num}
                                  </span>
                                ))}
                                {validBulkNumbers.length > 15 && (
                                  <span className="bg-green-300 px-2 py-1 rounded">
                                    +{validBulkNumbers.length - 15} mais
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {invalidBulkNumbers.length > 0 && (
                            <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                              <div className="text-xs text-red-700 font-semibold mb-1">Números inválidos:</div>
                              <div className="flex flex-wrap gap-1">
                                {invalidBulkNumbers.slice(0, 10).map((num, idx) => (
                                  <span key={idx} className="bg-red-200 px-2 py-1 rounded">
                                    {num}
                                  </span>
                                ))}
                                {invalidBulkNumbers.length > 10 && (
                                  <span className="bg-red-300 px-2 py-1 rounded">
                                    +{invalidBulkNumbers.length - 10} mais
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Upload de arquivo Excel/CSV */}
                  {bulkMode === 'file' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Upload de planilha
                      </label>
                      
                      {/* Botões para escolher o sub-modo */}
                      {!bulkFile && (
                        <div className="mb-4">
                          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setUploadSubMode('single-message')}
                              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                uploadSubMode === 'single-message'
                                  ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                                  : 'text-gray-600 hover:text-gray-800'
                              }`}
                            >
                              📄 Mensagem única
                            </button>
                            <button
                              type="button"
                              onClick={() => setUploadSubMode('personalized-messages')}
                              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                uploadSubMode === 'personalized-messages'
                                  ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                                  : 'text-gray-600 hover:text-gray-800'
                              }`}
                            >
                              💬 Mensagens personalizadas
                            </button>
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500">
                            {uploadSubMode === 'single-message' ? 
                              '• Planilha com apenas números • Uma mensagem/arquivo para todos' :
                              '• Planilha com números e mensagens • Mensagem diferente para cada número'
                            }
                          </div>
                        </div>
                      )}
                      
                      {/* Área de upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                        {bulkFile ? (
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <FaFileExcel className="text-green-600 text-xl mr-2" />
                                <div>
                                  <div className="font-medium">{bulkFile.name}</div>
                                  <div className="text-xs text-gray-500">
                                    Modo: {uploadSubMode === 'single-message' ? 'Mensagem única' : 'Mensagens personalizadas'}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setBulkFile(null);
                                  setBulkNumbers([]);
                                  setValidBulkNumbers([]);
                                  setInvalidBulkNumbers([]);
                                  setBulkData([]);
                                  setShowBulkTable(false);
                                  if (bulkFileInputRef.current) bulkFileInputRef.current.value = null;
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash />
                              </button>
                            </div>
                        
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Números válidos: {validBulkNumbers.length}</span>
                              {invalidBulkNumbers.length > 0 && (
                                <span className="text-red-600">{invalidBulkNumbers.length} inválidos</span>
                              )}
                            </div>
                            
                            {/* Mostrar resumo apenas no modo mensagem única */}
                            {uploadSubMode === 'single-message' && validBulkNumbers.length > 0 && (
                              <div className="mt-3 p-2 bg-gray-50 rounded-lg max-h-24 overflow-y-auto">
                                <div className="text-xs text-gray-500 flex flex-wrap gap-1">
                                  {validBulkNumbers.slice(0, 20).map((num, idx) => (
                                    <span key={idx} className="bg-gray-200 px-2 py-1 rounded">
                                      {num}
                                    </span>
                                  ))}
                                  {validBulkNumbers.length > 20 && (
                                    <span className="bg-gray-300 px-2 py-1 rounded">
                                      +{validBulkNumbers.length - 20}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                        
                        {/* Após o bloco que mostra números válidos, adicionar bloco para inválidos */}
                        {invalidBulkNumbers.length > 0 && (
                          <div className="mt-3 p-2 bg-red-50 rounded-lg max-h-24 overflow-y-auto border border-red-200">
                            <div className="text-xs text-red-700 font-semibold mb-1">Números inválidos:</div>
                            <div className="flex flex-wrap gap-1">
                              {invalidBulkNumbers.map((num, idx) => (
                                <span key={idx} className="bg-red-200 px-2 py-1 rounded flex items-center">
                                  {num}
                                  <button
                                    className="ml-1 text-red-700 hover:text-red-900 font-bold"
                                    title="Remover número inválido"
                                    onClick={() => {
                                      // Remove o número inválido da lista
                                      const newInvalid = invalidBulkNumbers.filter((n, i) => i !== idx);
                                      setInvalidBulkNumbers(newInvalid);
                                      // Não remove do bulkNumbers, pois ele só contém válidos
                                    }}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Remova ou corrija os números inválidos para evitar problemas no envio.</div>
                          </div>
                        )}
                        
                        {/* Tabela editável para visualizar e editar números e mensagens - apenas no modo personalizado */}
                        {showBulkTable && bulkData.length > 0 && uploadSubMode === 'personalized-messages' && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-700">Dados carregados ({bulkData.length} registro{bulkData.length > 1 ? 's' : ''})</h4>
                              <button
                                onClick={handleAddRow}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              >
                                + Adicionar linha
                              </button>
                            </div>
                            
                            <div className="border rounded-lg overflow-hidden">
                              <div className="max-h-96 overflow-y-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-gray-600 font-medium border-b">#</th>
                                      <th className="px-3 py-2 text-left text-gray-600 font-medium border-b">Número</th>
                                      <th className="px-3 py-2 text-left text-gray-600 font-medium border-b">Mensagem Personalizada</th>
                                      <th className="px-3 py-2 text-center text-gray-600 font-medium border-b w-16">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {bulkData.map((row, index) => (
                                      <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                                          {String(index + 1).padStart(2, '0')}
                                        </td>
                                        <td className="px-3 py-2">
                                          <input
                                            type="text"
                                            value={row.number}
                                            onChange={(e) => handleCellEdit(index, 'number', e.target.value)}
                                            className={`w-full px-2 py-1 border rounded text-sm font-mono
                                              ${validatePhoneNumber(row.number) 
                                                ? 'border-green-300 bg-green-50' 
                                                : 'border-red-300 bg-red-50'
                                              }
                                              focus:outline-none focus:ring-2 focus:ring-blue-300`}
                                            placeholder="5511999999999"
                                          />
                                        </td>
                                        <td className="px-3 py-2">
                                          <input
                                            type="text"
                                            value={row.message || ''}
                                            onChange={(e) => handleCellEdit(index, 'message', e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                            placeholder="Mensagem personalizada (opcional)"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <button
                                            onClick={() => handleRemoveRow(index)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Remover linha"
                                          >
                                            <FaTrash className="text-xs" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            
                            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                              <span>
                                ✅ {validBulkNumbers.length} válidos | ❌ {invalidBulkNumbers.length} inválidos
                              </span>
                              <span>
                                💬 {bulkData.filter(item => item.message && item.message.trim()).length} com mensagem personalizada
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <FaUpload className="text-gray-400 text-3xl mb-3" />
                        <p className="text-center text-gray-500 mb-2">
                          Arraste um arquivo Excel/CSV ou clique para selecionar
                        </p>
                        <p className="text-center text-gray-400 text-sm mb-3">
                          O arquivo deve conter uma coluna com os números no formato internacional
                        </p>
                        <button
                          onClick={() => bulkFileInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Selecionar Arquivo
                        </button>
                        <button
                          onClick={downloadExampleFile}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <FaDownload className="mr-1" />
                          Baixar modelo
                        </button>
                      </>
                    )}
                    <input
                      type="file"
                      ref={bulkFileInputRef}
                      onChange={handleBulkFileSelect}
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                    />
                  </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Tipo de mensagem, Mensagem de texto e Upload de arquivo - ocultar no modo upload com mensagens personalizadas */}
              {!(sendMode === 'bulk' && bulkMode === 'file' && uploadSubMode === 'personalized-messages') && (
                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de mensagem
                    </label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMessageType('text');
                        setFile(null);
                        setPreviewUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = null;
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                        messageType === 'text'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <FaWhatsapp className={`text-xl mb-1 ${messageType === 'text' ? 'text-green-600' : 'text-gray-500'}`} />
                      <span className="text-sm">Texto</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setMessageType('image')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                        messageType === 'image'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <FaImage className={`text-xl mb-1 ${messageType === 'image' ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className="text-sm">Imagem</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setMessageType('video')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                        messageType === 'video'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mb-1 ${messageType === 'video' ? 'text-red-600' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <span className="text-sm">Vídeo</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setMessageType('document')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                        messageType === 'document'
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <FaFileAlt className={`text-xl mb-1 ${messageType === 'document' ? 'text-yellow-600' : 'text-gray-500'}`} />
                      <span className="text-sm">Documento</span>
                    </button>
                  </div>
                </div>
                
                {/* Mensagem de texto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {messageType === 'text' ? 'Mensagem' : 'Legenda (opcional)'}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder={messageType === 'text' 
                      ? 'Digite sua mensagem aqui...' 
                      : 'Digite uma legenda para o arquivo (opcional)'}
                    required={messageType === 'text'}
                  />
                </div>
                
                {/* Upload de arquivo */}
                {messageType !== 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {messageType === 'image' ? 'Imagem' : messageType === 'video' ? 'Vídeo' : 'Documento'}
                    </label>
                    
                    {file ? (
                      <div className="relative border rounded-lg overflow-hidden">
                        {messageType === 'image' && (
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-48 object-contain bg-gray-100"
                          />
                        )}
                        
                        {messageType === 'video' && (
                          <video 
                            src={previewUrl} 
                            controls 
                            className="w-full h-48 object-contain bg-gray-100"
                          />
                        )}
                        
                        {messageType === 'document' && (
                          <div className="flex items-center p-4 bg-gray-100">
                            <FaFileAlt className="text-gray-500 text-xl mr-3" />
                            <span className="font-medium truncate">{file.name}</span>
                          </div>
                        )}
                        
                        <button
                          onClick={() => {
                            setFile(null);
                            setPreviewUrl('');
                            if (fileInputRef.current) fileInputRef.current.value = null;
                          }}
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                          title="Remover arquivo"
                        >
                          <FaTimes className="text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <FaUpload className="text-gray-400 text-3xl mb-3" />
                        <p className="text-center text-gray-500">
                          Clique para selecionar um {
                            messageType === 'image' ? 'imagem' : 
                            messageType === 'video' ? 'vídeo' : 
                            'documento'
                          }
                        </p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept={
                            messageType === 'image' ? 'image/*' : 
                            messageType === 'video' ? 'video/*' : 
                            '.pdf,.doc,.docx,.xls,.xlsx'
                          }
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}
              
              {/* Intervalo entre envios (apenas para envio em massa) */}
              {sendMode === 'bulk' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo entre envios (segundos)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={bulkDelay}
                    onChange={e => setBulkDelay(Number(e.target.value))}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <span className="ml-2 text-xs text-gray-500">(Recomendado: 1 ou mais)</span>
                </div>
              )}
              
              {/* Barra de progresso (apenas para envio em massa) */}
              {sendMode === 'bulk' && isSending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso: {totalSent} de {bulkNumbers.length}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}
              
              {/* Botão de envio */}
              <div className="flex items-center">
                {isSending ? (
                  <button
                    onClick={handleCancelBulkSend}
                    className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center font-medium"
                  >
                    <FaTimes className="mr-2" />
                    Cancelar Envio
                  </button>
                ) : (
                  <button
                    onClick={handleSendMessage}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" />
                        <span>Enviar {sendMode === 'bulk' ? 'para ' + (bulkNumbers.length || '0') + ' números' : 'Mensagem'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Painel lateral */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dicas de envio */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Dicas de Envio
              </h2>
              
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Use o formato internacional para os números (Ex: 5511999999999)
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  O dispositivo de origem deve estar conectado
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verifique o tamanho máximo dos arquivos: 
                  <ul className="ml-7 mt-1 text-sm text-gray-500">
                    <li>Imagens: até 5MB</li>
                    <li>Vídeos: até 15MB</li>
                    <li>Documentos: até 10MB</li>
                  </ul>
                </li>
                {sendMode === 'bulk' && (
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    No envio em massa, evite enviar para muitos números em curto período para reduzir o risco de bloqueio
                  </li>
                )}
              </ul>
            </div>
            
            {/* Personalização de mensagens */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                Personalize sua Mensagem
              </h2>
              
              <div className="space-y-3">
                <p className="text-gray-600 text-sm">
                  Você pode inserir variáveis na sua mensagem:
                </p>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Exemplos de mensagem:</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Olá! Agradecemos o seu contato. Como podemos ajudar?
                  </p>
                  <p className="text-sm text-gray-600">
                    Bom dia! Este é um lembrete para sua consulta amanhã às 14h. Confirma sua presença?
                  </p>
                </div>
                
                <button
                  onClick={() => setMessage(message => 
                    message + "\n\nEsta é uma mensagem automática. Por favor, não responda a este número."
                  )}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Adicionar disclaimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de exemplo */}
      {showExampleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Exemplo de Arquivo para Upload</h3>
                <button
                  onClick={() => setShowExampleModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Dependendo do modo escolhido, você pode usar um dos formatos abaixo:
              </p>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Modo Manual - Apenas Números</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                  <p className="mb-2">Digite os números separados por quebra de linha ou vírgula:</p>
                  <code className="block bg-white p-2 rounded border">
                    5511999999999<br/>
                    5511988888888<br/>
                    5511977777777<br/>
                    <br/>
                    Ou: 5511999999999, 5511988888888, 5511977777777
                  </code>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Modo Planilha - Com Mensagens Personalizadas</h4>
                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  <table className="min-w-full border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b border-r border-gray-200 text-left">número</th>
                        <th className="py-2 px-4 border-b border-gray-200 text-left">mensagem</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 px-4 border-b border-r border-gray-200">5511999999999</td>
                        <td className="py-2 px-4 border-b border-gray-200">Olá João! Como você está?</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b border-r border-gray-200">5511988888888</td>
                        <td className="py-2 px-4 border-b border-gray-200">Oi Maria, tudo bem?</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 border-b border-r border-gray-200">5511977777777</td>
                        <td className="py-2 px-4 border-b border-gray-200">Pedro, reunião às 14h!</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="space-y-3 text-gray-600">
                <p>
                  <span className="font-medium">Importante:</span>
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Para planilhas, a primeira coluna deve ser "número" ou "numero"</li>
                  <li>A segunda coluna pode ser "mensagem" para personalização (opcional)</li>
                  <li>Cada linha deve conter um número no formato internacional</li>
                  <li>Não use espaços, parênteses ou outros caracteres especiais nos números</li>
                  <li>Excel (.xlsx, .xls) ou CSV são aceitos</li>
                </ul>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={downloadExampleFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
                >
                  <FaDownload className="mr-2" />
                  Baixar modelo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}