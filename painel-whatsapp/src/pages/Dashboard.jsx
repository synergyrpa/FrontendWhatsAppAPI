import DashboardLayout from '../layouts/DashboardLayout';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>
      <p className="text-gray-600">Bem-vindo ao painel administrativo!</p>
    </DashboardLayout>
  );
}
