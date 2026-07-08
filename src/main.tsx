import React from 'react';
import ReactDOM from 'react-dom/client';
import { GeistProvider, CssBaseline } from '@geist-ui/core';
import { AuthProvider } from './features/auth/AuthProvider';
import Home from './pages/Home';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GeistProvider themeType="dark">
      <CssBaseline />
      <AuthProvider>
        <Home />
      </AuthProvider>
    </GeistProvider>
  </React.StrictMode>
);
