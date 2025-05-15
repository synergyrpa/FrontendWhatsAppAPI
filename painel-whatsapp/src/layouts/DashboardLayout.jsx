// src/layouts/DashboardLayout.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Função para receber o estado do sidebar dos componentes filhos
  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex min-h-screen">
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
        <Sidebar onCollapse={handleSidebarCollapse} />
      </div>
      <div className="flex-1 bg-gray-100 p-10">{children}</div>
    </div>
  );
}
