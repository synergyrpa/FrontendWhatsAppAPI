import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setAuthData, setUserEmail } from '../utils/auth';

export default function ValidateOTP() {
  const [emailOTP, setEmailOTP] = useState('');
  const [whatsappOTP, setWhatsappOTP] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleValidateOTP = async (e) => {
    e.preventDefault();
    setErro('');
    const WppApiEndpoint = import.meta.env.VITE_WPP_API_ENDPOINT;

    try {
      const emailResponse = await axios.post(`${WppApiEndpoint}/api/v1/validate-otp`, {
        otp_type: 'login',
        otp_for: 'email',
        email_otp_code: emailOTP,
        email: localStorage.getItem('pendingEmail'),
      });

      const whatsappResponse = await axios.post(`${WppApiEndpoint}/api/v1/validate-otp`, {
        otp_type: 'login',
        otp_for: 'number',
        number_otp_code: whatsappOTP,
        email: localStorage.getItem('pendingEmail'),
        number: localStorage.getItem('pendingPhone'),
      });

      if (emailResponse.data.success && whatsappResponse.data.success) {
        localStorage.setItem('token', localStorage.getItem('pendingEmail'));
        localStorage.removeItem('pendingEmail');
        navigate('/dashboard');
      } else {
        setErro('Códigos inválidos');
      }
    } catch (error) {
      console.error(error);
      setErro('Erro ao validar códigos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-slate-200 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-blue-100">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Validar <span className="text-blue-600">Códigos</span>
        </h1>

        {erro && (
          <div className="bg-red-100 text-red-600 border border-red-200 rounded-md text-sm text-center px-4 py-2 mb-4">
            {erro}
          </div>
        )}

        <form onSubmit={handleValidateOTP} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Código de Verificação do E-mail</label>
            <input
              type="text"
              value={emailOTP}
              onChange={(e) => setEmailOTP(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Digite o código recebido por e-mail"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Código de Verificação do WhatsApp</label>
            <input
              type="text"
              value={whatsappOTP}
              onChange={(e) => setWhatsappOTP(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Digite o código recebido por WhatsApp"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Validar Códigos
          </button>
        </form>
      </div>
    </div>
  );
} 