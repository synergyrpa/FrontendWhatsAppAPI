import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageNumbers from './pages/ManageNumbers';
import QRCodePage from './pages/QRCodePage';
import Reports from './pages/Reports';
import PrivateRoute from './routes/PrivateRoute';
import StatusPage from './pages/StatusPage';
import Register from './pages/RegisterRequestOTP';
import OTPVerification from './pages/LoginValidateOTP';
import Home from './pages/Home';
import SendMessages from './pages/SendMessages';

export default function App() {
  const [appError, setAppError] = useState(null);

  useEffect(() => {
    // Capturar erros não tratados
    const handleError = (event) => {
      console.error('Erro não tratado capturado:', event.error);
      setAppError(event.error);
    };

    const handleUnhandledRejection = (event) => {
      console.error('Promise rejeitada não tratada:', event.reason);
      setAppError(event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Tela de erro se algo der errado
  if (appError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado</h1>
          <p className="text-gray-600 mb-4">Ocorreu um erro inesperado na aplicação.</p>
          <button 
            onClick={() => {
              setAppError(null);
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/validate-otp" element={<OTPVerification />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/manage-numbers"
          element={
            <PrivateRoute>
              <ManageNumbers />
            </PrivateRoute>
          }
        />
        <Route
          path="/qrcode"
          element={
            <PrivateRoute>
              <QRCodePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/qrcode/:number"
          element={
            <PrivateRoute>
              <QRCodePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/status"
          element={
            <PrivateRoute>
              <StatusPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          }
        />
        <Route
          path="/send-messages"
          element={
            <PrivateRoute>
              <SendMessages />
            </PrivateRoute>
          }
        />
        {/* Rota catch-all para páginas não encontradas */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
