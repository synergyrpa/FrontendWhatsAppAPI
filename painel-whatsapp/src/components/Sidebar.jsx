import { Link, useLocation } from 'react-router-dom';
import LogoutButton from './LogoutButton';
const Sidebar = () => {
  const location = useLocation();

  const links = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/qrcode', label: 'QRCode' },
    { path: '/manage-numbers', label: 'Números' },
    { path: '/reports', label: 'Relatórios' },
  ];

  return (
    <aside className="w-64 h-screen bg-blue-700 text-white flex flex-col">
      <div className="text-2xl font-bold p-6 border-b border-blue-500">
        Painel WA
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`block px-3 py-2 rounded transition ${
              location.pathname === link.path
                ? 'bg-blue-900'
                : 'hover:bg-blue-800'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-blue-600">
        <LogoutButton />
      </div>
    </aside>
  );
};

export default Sidebar;
