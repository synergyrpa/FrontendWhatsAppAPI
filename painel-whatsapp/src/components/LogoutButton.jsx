import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white text-sm px-4 py-2 rounded hover:bg-red-700 transition"
    >
      Sair
    </button>
  );
}
