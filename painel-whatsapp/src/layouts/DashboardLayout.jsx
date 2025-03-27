// src/layouts/DashboardLayout.jsx
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-blue-700 text-white">
        <Sidebar />
      </div>
      <div className="flex-1 bg-gray-100 p-10">{children}</div>
    </div>
  );
}
