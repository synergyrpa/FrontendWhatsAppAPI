import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageNumbers from './pages/ManageNumbers';
import QRCodePage from './pages/QRCodePage';
import Reports from './pages/Reports';
import PrivateRoute from './routes/PrivateRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
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
          path="/reports"
          element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
