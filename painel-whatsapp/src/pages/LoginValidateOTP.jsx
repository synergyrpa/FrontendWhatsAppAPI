import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaEnvelope, FaWhatsapp, FaShieldAlt, FaArrowRight, FaLock } from 'react-icons/fa';
import { setAuthData, setUserEmail } from '../utils/auth';
import { useNumbers } from '../context/NumbersContext';

export default function ValidateOTP() {
  const [emailOTP, setEmailOTP] = useState('');
  const [whatsappOTP, setWhatsappOTP] = useState('');
  const [erro, setErro] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animated, setAnimated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshNumbers } = useNumbers();

  useEffect(() => {
    // Check if we're coming from login or register
    const fromLogin = location.state?.from === 'login';
    setIsLogin(fromLogin);
    setAnimated(true);
  }, [location]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    const WppApiEndpoint = import.meta.env.VITE_WPP_API_ENDPOINT;

    try {
      const payload = isLogin 
        ? {
            otp_type: 'login',
            otp_for: 'email',
            email: localStorage.getItem('pendingEmail'),
            email_otp_code: emailOTP,
          }
        : {
            otp_type: 'register',
            otp_for: 'email',
            email: localStorage.getItem('pendingEmail'),
            number: localStorage.getItem('pendingPhone'),
            email_otp_code: emailOTP,
            number_otp_code: whatsappOTP,
          };

      const response = await axios.post(`${WppApiEndpoint}/api/v2/auth/otp/validate`, payload);

      if (response.data.success) {
        console.log('✅ OTP validado com sucesso:', response.data);
        
        // Salvar o token de autenticação retornado pela API
        const { token, expires_in } = response.data;
        if (token && expires_in) {
          console.log('💾 Salvando token de autenticação...');
          const authSaved = setAuthData(token, expires_in);
          
          if (authSaved) {
            // Salvar email do usuário se disponível
            const userEmail = localStorage.getItem('pendingEmail');
            if (userEmail) {
              setUserEmail(userEmail);
            }
            // Forçar refresh dos números antes de navegar
            await refreshNumbers?.();
            console.log('🎉 Autenticação salva com sucesso, números atualizados, redirecionando para dashboard...');
          } else {
            console.error('❌ Erro ao salvar dados de autenticação');
            setErro('Erro interno ao salvar autenticação');
            return;
          }
        } else {
          console.error('❌ Token não encontrado na resposta da API:', response.data);
          setErro('Erro interno: token não recebido');
          return;
        }
        
        // Limpar dados temporários
        localStorage.removeItem('pendingEmail');
        if (!isLogin) {
          localStorage.removeItem('pendingPhone');
        }
        
        navigate('/dashboard');
      } else {
        setErro('Verificação inválida: Códigos incorretos');
      }
    } catch (error) {
      console.error(error);
      setErro(error.response?.data?.description || 'Código OTP inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const resendCodes = async () => {
    setErro('');
    setLoading(true);
    const WppApiEndpoint = import.meta.env.VITE_WPP_API_ENDPOINT;
    const email = localStorage.getItem('pendingEmail');
    const phone = localStorage.getItem('pendingPhone');

    try {
      console.log('WppApiEndpoint',WppApiEndpoint)
      if (isLogin) {
        await axios.post(`${WppApiEndpoint}/api/v2/auth/otp/request`, {
          otp_type: 'login',
          otp_for: 'email',
          email: email,
        });
      } else {
        await axios.post(`${WppApiEndpoint}/api/v2/auth/otp/request`, {
          otp_type: 'register',
          otp_for: 'email',
          email: email,
          number: phone,
        });

        await axios.post(`${WppApiEndpoint}/api/v2/auth/otp/request`, {
          otp_type: 'register',
          otp_for: 'number',
          number: phone,
          email: email,
        });
      }
      
      // Mostrar confirmação temporária
      setErro('');
      alert('Códigos reenviados com sucesso!');
      
    } catch (error) {
      console.error(error);
      setErro('Erro ao reenviar códigos. Tente novamente.');
    } finally {
      setLoading(false);
    }
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
                <FaLock className="text-white text-2xl" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
              {isLogin ? 'Verificação de Login' : 'Verificação de Registro'}
            </h1>
            
            <p className="text-center text-gray-600 mb-6">
              {isLogin 
                ? 'Insira o código de verificação enviado para seu e-mail' 
                : 'Insira os códigos enviados para seu e-mail e WhatsApp'}
            </p>

            {erro && (
              <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm px-4 py-3 mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {erro}
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaEnvelope className="mr-2 text-blue-500" /> Código do E-mail
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={emailOTP}
                      onChange={(e) => setEmailOTP(e.target.value)}
                      required
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Digite o código de 6 dígitos"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Verifique sua caixa de entrada e pasta de spam</p>
                </div>
                
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FaWhatsapp className="mr-2 text-green-500" /> Código do WhatsApp
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={whatsappOTP}
                        onChange={(e) => setWhatsappOTP(e.target.value)}
                        required
                        maxLength={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Digite o código de 6 dígitos"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Enviado para o número cadastrado</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center font-medium text-lg"
              >
                {loading ? (
                  <>
                    <span className="mr-2">Verificando</span>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? 'Verificar Login' : 'Verificar Registro'}</span>
                    <FaArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6 space-y-4">
              <button 
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
              >
                Voltar para o login
              </button>
              
              <div>
                <button 
                  onClick={resendCodes}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 text-sm transition-colors flex items-center justify-center mx-auto"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></span>
                  ) : null}
                  Reenviar códigos
                </button>
              </div>
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