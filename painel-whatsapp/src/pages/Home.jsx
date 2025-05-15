import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaWhatsapp, FaChartLine, FaUsers, FaRocket } from 'react-icons/fa';

export default function Home() {
  const navigate = useNavigate();
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      {/* Header com ondas */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 transform -skew-y-6 z-0 h-96 -top-24"></div>
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Seção de cabeçalho */}
          <div className={`text-center mb-24 transition-all duration-1000 ${animated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-12'}`}>
            <div className="inline-block p-3 rounded-full bg-white shadow-xl mb-8">
              <FaWhatsapp className="text-5xl text-green-500" />
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
              Bem-vindo ao <span className="text-blue-200">Painel WhatsApp</span>
            </h1>
            <p className="text-xl text-black-100 mb-8 max-w-3xl mx-auto">
              Gerencie suas mensagens e contatos do WhatsApp de forma eficiente e organizada com nossa plataforma intuitiva
            </p>
          </div>

          {/* Cards de login/registro */}
          <div className={`grid md:grid-cols-2 gap-10 max-w-3xl mx-auto transition-all duration-1000 delay-300 ${animated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-12'}`}>
            <div className="bg-white p-10 rounded-2xl shadow-2xl border border-blue-100 hover:shadow-blue-200/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-bl-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Já tem uma conta?</h2>
                <p className="text-gray-600 mb-8">Faça login para acessar seu painel e gerenciar suas conversas</p>
              </div>
              <div className="mt-auto">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-blue-500/30 font-medium text-lg flex items-center justify-center"
                >
                  <span>Entrar</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-white p-10 rounded-2xl shadow-2xl border border-green-100 hover:shadow-green-200/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-bl-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Novo por aqui?</h2>
                <p className="text-gray-600 mb-8">Crie sua conta e comece a usar nossa plataforma agora mesmo</p>
              </div>
              <div className="mt-auto">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-green-500/30 font-medium text-lg flex items-center justify-center"
                >
                  <span>Registrar</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Seção de recursos */}
          <div className={`mt-24 transition-all duration-1000 delay-500 ${animated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-12'}`}>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Recursos exclusivos para você</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow border-t-4 border-blue-500 flex flex-col items-center text-center">
                <div className="bg-blue-100 p-4 rounded-full mb-6">
                  <FaUsers className="text-3xl text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Gerenciamento inteligente</h3>
                <p className="text-gray-600">Controle seus contatos e mensagens com uma interface intuitiva e poderosa</p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow border-t-4 border-indigo-500 flex flex-col items-center text-center">
                <div className="bg-indigo-100 p-4 rounded-full mb-6">
                  <FaChartLine className="text-3xl text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Relatórios detalhados</h3>
                <p className="text-gray-600">Acompanhe suas métricas e resultados com dashboard interativo e insights valiosos</p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow border-t-4 border-green-500 flex flex-col items-center text-center">
                <div className="bg-green-100 p-4 rounded-full mb-6">
                  <FaRocket className="text-3xl text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Integração simples</h3>
                <p className="text-gray-600">Conecte-se facilmente com o WhatsApp e outras plataformas de comunicação</p>
              </div>
            </div>
          </div>
          
          {/* Seção de CTA final */}
          <div className={`mt-20 text-center transition-all duration-1000 delay-700 ${animated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <p className="text-lg text-gray-700 mb-6">Pronto para revolucionar seu atendimento?</p>
            <button 
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-8 rounded-full text-lg font-medium shadow-lg hover:shadow-indigo-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Comece agora gratuitamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}