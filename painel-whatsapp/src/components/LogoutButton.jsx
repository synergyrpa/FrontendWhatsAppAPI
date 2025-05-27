import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { clearAuthData } from '../utils/auth';

const LogoutButton = ({ collapsed = false }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('🚪 Fazendo logout...');
    clearAuthData();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center py-2 px-3 rounded-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all shadow-sm hover:shadow w-full ${
        collapsed ? 'justify-center' : 'justify-start'
      }`}
    >
      <FaSignOutAlt />
      {!collapsed && <span className="ml-2">Sair</span>}
    </button>
  );
};

export default LogoutButton;
