import React from 'react';
import ReactDOM from 'react-dom/client';
import { GeistProvider, CssBaseline } from '@geist-ui/core';
import Home from './pages/Home';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GeistProvider themeType="dark">
      <CssBaseline />
      <Home />
    </GeistProvider>
  </React.StrictMode>
);
