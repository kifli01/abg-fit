import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/useAuth';
import { Loading } from '@geist-ui/core';
import Home from './pages/Home';
import AppShell from './components/layout/AppShell';
import ExerciseLibrary from './pages/ExerciseLibrary';

const ExerciseImport = lazy(() => import('./pages/admin/ExerciseImport'));

/**
 * Top-level routing.
 * Signed-out  → /  (Home / login screen)
 * Authorized  → /exercises  (main authenticated destination)
 * Authorized  → /admin/exercise-import  (admin-only import tool)
 * Any unknown authenticated path → redirect to /exercises
 */
const App: React.FC = () => {
  const { isLoading, isAuthorized } = useAuth();

  if (isLoading) {
    return (
      <div className="app-loading">
        <Loading>Loading…</Loading>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/exercises" replace />} />
        <Route path="/exercises" element={<ExerciseLibrary />} />
        <Route
          path="/admin/exercise-import"
          element={
            <Suspense fallback={<div className="app-loading"><Loading>Loading…</Loading></div>}>
              <ExerciseImport />
            </Suspense>
          }
        />
        {/* Future authenticated routes go here */}
      </Route>
      <Route path="*" element={<Navigate to="/exercises" replace />} />
    </Routes>
  );
};

export default App;
