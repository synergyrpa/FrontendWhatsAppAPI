import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { getUserEmail } from '../utils/auth';
import { 
  FaComments, 
  FaExternalLinkAlt, 
  FaChartBar, 
  FaUsers, 
  FaRocket,
  FaShieldAlt,
  FaClock,
  FaMobile
} from 'react-icons/fa';

export default function ChatDesk() {
  const navigate = useNavigate();
  const userEmail = getUserEmail();
  const [isLoading, setIsLoading] = useState(false);

  const chatdeskUrl = import.meta.env.VITE_CHATDESK_URL || 'https://chatdesk.synergyrpa.com/';
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'suporte@synergyrpa.com';
  const supportWhatsApp = import.meta.env.VITE_SUPPORT_WHATSAPP || '5511999999999';

  const handleAccessPlatform = () => {
    window.open(chatdeskUrl, '_blank');
  };

  const handleAccessReports = () => {
    navigate('/chatdesk/reports');
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full shadow-lg">
                <FaComments className="text-white text-4xl" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              ChatDesk
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Plataforma completa de atendimento ao cliente com design moderno 
              e funcionalidades avançadas para oferecer a melhor experiência 
              em comunicação multicanal.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <FaUsers className="text-blue-600 text-3xl mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">Gestão de Equipe</h3>
              <p className="text-gray-600 text-sm">
                Organize seus agentes e monitore performance em tempo real
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <FaMobile className="text-green-600 text-3xl mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">Multicanal</h3>
              <p className="text-gray-600 text-sm">
                WhatsApp, Email, Chat web e redes sociais em um só lugar
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <FaRocket className="text-purple-600 text-3xl mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">Automação</h3>
              <p className="text-gray-600 text-sm">
                Chatbots inteligentes e respostas automáticas
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <FaChartBar className="text-orange-600 text-3xl mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">Relatórios</h3>
              <p className="text-gray-600 text-sm">
                Análises detalhadas e métricas de performance
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                  Sobre a Plataforma ChatDesk
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    O ChatDesk é uma solução completa de atendimento ao cliente que centraliza 
                    todas as conversas em uma única plataforma. Com arquitetura moderna e robusta, 
                    oferece uma experiência única e intuitiva para equipes de suporte.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FaShieldAlt className="text-green-500 mr-3" />
                      <span>Interface intuitiva e moderna</span>
                    </div>
                    <div className="flex items-center">
                      <FaClock className="text-blue-500 mr-3" />
                      <span>Respostas em tempo real</span>
                    </div>
                    <div className="flex items-center">
                      <FaUsers className="text-purple-500 mr-3" />
                      <span>Colaboração em equipe</span>
                    </div>
                    <div className="flex items-center">
                      <FaChartBar className="text-orange-500 mr-3" />
                      <span>Analytics avançados</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:pl-8">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-xl text-white text-center">
                  <FaComments className="text-6xl mx-auto mb-4 opacity-80" />
                  <h3 className="text-2xl font-bold mb-2">
                    Conectado como:
                  </h3>
                  <p className="text-blue-100 text-lg font-medium mb-6">
                    {userEmail || 'usuário@exemplo.com'}
                  </p>
                  <div className="space-y-4">
                    <button
                      onClick={handleAccessPlatform}
                      disabled={isLoading}
                      className="w-full bg-white text-blue-600 py-3 px-6 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                      <FaExternalLinkAlt className="mr-2" />
                      Acessar Plataforma
                    </button>

                    <button
                      onClick={handleAccessReports}
                      disabled={isLoading}
                      className="w-full bg-blue-400 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-500 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                      <FaChartBar className="mr-2" />
                      Ver Relatórios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">
              Precisa de Acesso?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Se você não conseguir acessar os relatórios ou a plataforma principal, 
              entre em contato conosco para configurar seu acesso ao ChatDesk.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href={`mailto:${supportEmail}`}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all"
              >
                Contato por Email
              </a>
              <a 
                href={`https://wa.me/${supportWhatsApp}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all"
              >
                WhatsApp Suporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
