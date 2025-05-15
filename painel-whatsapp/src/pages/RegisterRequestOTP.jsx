import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNumbers } from '../context/NumbersContext';
import { FaEnvelope, FaWhatsapp, FaUser, FaArrowRight, FaPhoneAlt, FaLock } from 'react-icons/fa';

export default function Register() {
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [animated, setAnimated] = useState(false);
  const navigate = useNavigate();
  const { refreshNumbers } = useNumbers();

  useEffect(() => {
    setAnimated(true);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    const WppApiEndpoint = import.meta.env.VITE_WPP_API_ENDPOINT;
    
    if (!validateEmail(email)) {
      setErro('E-mail inválido');
      setLoading(false);
      return;
    }

    if (!validatePhoneNumber(celular)) {
      setErro('Número de celular inválido. Use o formato internacional (Ex: 5511999999999)');
      setLoading(false);
      return;
    }

    try {
      const emailResponse = await axios.post(`${WppApiEndpoint}/api/v1/request-otp`, {
        otp_type: 'register',
        otp_for: 'email',
        email: email,
        number: celular,
      });

      const whatsappResponse = await axios.post(`${WppApiEndpoint}/api/v1/request-otp`, {
        otp_type: 'register',
        otp_for: 'number',
        number: celular,
        email: email,
      });

      if (emailResponse.data.success && whatsappResponse.data.success) {
        localStorage.setItem('pendingEmail', email);
        localStorage.setItem('pendingPhone', celular);
        refreshNumbers();
        navigate('/validate-otp', { state: { from: 'register' } });
      } else {
        setErro('Erro ao solicitar códigos de verificação');
      }
    } catch (error) {
      console.error(error);
      setErro(error.response?.data?.description || 'Erro ao registrar usuário. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhoneNumber = (phone) => {
    // Formato internacional: apenas números, pelo menos 10 dígitos
    return /^\d{10,15}$/.test(phone);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className={`w-full max-w-md transition-all duration-700 ${animated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100 relative overflow-hidden">
          {/* Elementos decorativos */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-50 rounded-tr-full opacity-70"></div>
          
          <div className="relative">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                <FaUser className="text-white text-2xl" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
              Criar Conta
            </h1>
            
            <p className="text-center text-gray-600 mb-6">
              Registre-se para acessar o painel de WhatsApp
            </p>

            {erro && (
              <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm px-4 py-3 mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {erro}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaEnvelope className="mr-2 text-blue-500" /> E-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="usuario@email.com"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Você receberá um código de verificação neste e-mail</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaPhoneAlt className="mr-2 text-blue-500" /> Número de WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="5511999999999"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Use o formato internacional, apenas números (Ex: 5511999999999)</p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center font-medium text-lg"
              >
                {loading ? (
                  <>
                    <span className="mr-2">Processando</span>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  </>
                ) : (
                  <>
                    <span>Cadastrar</span>
                    <FaArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-gray-600">Já tem uma conta?</p>
              <button 
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-800 text-sm transition-colors mt-1 font-medium"
              >
                Fazer login
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-4 text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Painel WhatsApp. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
