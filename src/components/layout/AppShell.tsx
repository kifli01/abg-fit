import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppDrawer from './AppDrawer';

/**
 * AppShell wraps all authenticated pages.
 * Renders the header, the slide-out navigation drawer,
 * and the current page via <Outlet />.
 */
const AppShell: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-shell">
      <AppHeader onMenuClick={() => setDrawerOpen(true)} />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
