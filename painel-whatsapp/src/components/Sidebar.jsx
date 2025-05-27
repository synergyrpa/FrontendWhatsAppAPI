import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import { getUserEmail } from '../utils/auth';
import { 
  FaHome, 
  FaQrcode, 
  FaMobile, 
  FaChartBar, 
  FaWifi, 
  FaWhatsapp,
  FaChevronRight,
  FaPaperPlane
} from 'react-icons/fa';

const Sidebar = ({ onCollapse }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Notificar o componente pai quando o estado do sidebar mudar
  useEffect(() => {
    if (typeof onCollapse === 'function') {
      onCollapse(collapsed);
    }
  }, [collapsed, onCollapse]);

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { path: '/send-messages', label: 'Enviar Mensagens', icon: <FaPaperPlane /> },
    { path: '/qrcode', label: 'QRCode', icon: <FaQrcode /> },
    { path: '/manage-numbers', label: 'Números', icon: <FaMobile /> },
    { path: '/reports', label: 'Relatórios', icon: <FaChartBar /> },
    { path: '/status', label: 'Status', icon: <FaWifi /> },
  ];

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside className={`flex flex-col min-h-screen h-full bg-gradient-to-b from-blue-800 to-indigo-900 text-white transition-all duration-300 relative ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Toggle button */}
      <button 
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 bg-blue-600 text-white p-1 rounded-full shadow-lg border border-blue-300 z-20"
      >
        <FaChevronRight className={`transition-transform duration-300 ${collapsed ? '' : 'transform rotate-180'}`} />
      </button>
      
      {/* Logo header */}
      <div className={`flex items-center p-6 border-b border-blue-700/50 ${collapsed ? 'justify-center' : 'justify-start'}`}>
        <div className="bg-white p-2 rounded-lg shadow-inner">
          <FaWhatsapp className="text-green-500 text-2xl" />
        </div>
        {!collapsed && (
          <div className="ml-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Painel WA
            </h1>
            <p className="text-xs text-blue-300">WhatsApp Manager</p>
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-transparent">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center px-3 py-3 rounded-lg transition-all ${
              location.pathname === link.path
                ? 'bg-white/10 text-white shadow-lg border-l-4 border-blue-400'
                : 'hover:bg-white/5 text-blue-100'
            } ${collapsed ? 'justify-center' : 'justify-start'}`}
            title={collapsed ? link.label : ''}
          >
            <div className={`${location.pathname === link.path ? 'text-blue-300' : 'text-blue-300'} ${collapsed ? 'text-xl' : ''}`}>
              {link.icon}
            </div>
            {!collapsed && (
              <span className="ml-3 font-medium">{link.label}</span>
            )}
            {!collapsed && location.pathname === link.path && (
              <span className="ml-auto bg-blue-400 w-2 h-2 rounded-full"></span>
            )}
          </Link>
        ))}
      </nav>
      
      {/* User info & logout */}
      <div className={`p-4 mt-auto border-t border-blue-700/50 ${collapsed ? 'text-center' : ''}`}>
        {!collapsed && (
          <div className="mb-4">
            <p className="text-sm text-blue-300 mb-1">Usuário conectado</p>
            <p className="text-white font-medium truncate">{getUserEmail() || 'usuário@exemplo.com'}</p>
          </div>
        )}
        <LogoutButton collapsed={collapsed} />
      </div>
    </aside>
  );
};

export default Sidebar;
