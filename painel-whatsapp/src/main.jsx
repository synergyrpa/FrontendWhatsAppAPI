import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // <- ESSENCIAL
import { NumbersProvider } from './context/NumbersContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NumbersProvider>
      <App />
    </NumbersProvider>
  </React.StrictMode>
);
