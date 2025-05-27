import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // <- ESSENCIAL
import { NumbersProvider } from './context/NumbersContext';

console.log("🚀 Iniciando aplicação...");

// Verificar se o elemento root existe
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("❌ Elemento 'root' não encontrado no DOM!");
  throw new Error("Elemento 'root' não encontrado");
}

console.log("✅ Elemento root encontrado, criando aplicação React...");

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <NumbersProvider>
        <App />
      </NumbersProvider>
    </React.StrictMode>
  );
  console.log("✅ Aplicação React renderizada com sucesso!");
} catch (error) {
  console.error("❌ Erro ao renderizar aplicação React:", error);
  // Fallback manual em caso de erro
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h1 style="color: red;">Erro ao carregar a aplicação</h1>
      <p>Ocorreu um erro ao inicializar a aplicação. Por favor, recarregue a página.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Recarregar Página
      </button>
    </div>
  `;
}
