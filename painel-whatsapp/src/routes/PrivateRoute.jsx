import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

export default function PrivateRoute({ children }) {
  console.log("PrivateRoute verificando autenticação...");
  
  try {
    const authenticated = isAuthenticated();
    console.log("Usuário autenticado:", authenticated);
    
    if (!authenticated) {
      console.log("Redirecionando para login...");
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (error) {
    console.error("Erro no PrivateRoute:", error);
    return <Navigate to="/login" replace />;
  }
}
