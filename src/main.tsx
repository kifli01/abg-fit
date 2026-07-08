import React from 'react';
import ReactDOM from 'react-dom/client';
import { GeistProvider, CssBaseline } from '@geist-ui/core';
import Home from './pages/Home';
import './styles/global.css';
import { useOrientationLock } from './hooks/useOrientationLock';

/**
 * App wrapper that activates orientation locking at the root level.
 * Placed here so it runs once for the entire application lifetime.
 */
function App(): React.ReactElement {
  useOrientationLock();
  return <Home />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GeistProvider themeType="dark">
      <CssBaseline />
      <App />
    </GeistProvider>
  </React.StrictMode>
);
