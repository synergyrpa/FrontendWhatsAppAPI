import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNumbers } from '../context/NumbersContext';


export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();
  const { refreshNumbers } = useNumbers();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    const WppApiEndpoint = import.meta.env.VITE_WPP_API_ENDPOINT

    try {
      const response = await axios.post(`${WppApiEndpoint}/api/v1/login-user`, {
        login: email,
        password: senha,
      });
      console.log(response);

      const token = email;
      // const token = response.data.token;
      
      if (token) {
        localStorage.setItem('token', token);
        refreshNumbers();
        navigate('/dashboard');
      } else {
        setErro('Login inválido: token ausente');
      }
    } catch (error) {
      console.error(error);
      setErro('Email ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-slate-200 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-blue-100">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Painel <span className="text-blue-600">WhatsApp</span>
        </h1>

        {erro && (
          <div className="bg-red-100 text-red-600 border border-red-200 rounded-md text-sm text-center px-4 py-2 mb-4">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-600 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md"
              placeholder="usuario@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
