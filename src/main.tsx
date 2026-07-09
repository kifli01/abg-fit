import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GeistProvider, CssBaseline } from '@geist-ui/core';
import { AuthProvider } from './features/auth/AuthProvider';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GeistProvider themeType="dark">
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GeistProvider>
  </React.StrictMode>
);
