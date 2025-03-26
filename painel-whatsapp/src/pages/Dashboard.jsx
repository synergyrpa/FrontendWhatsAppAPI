import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo ao seu painel de controle.</p>
      </div>
    </div>
  );
}
