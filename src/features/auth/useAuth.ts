import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import type { AuthState } from './types';

/**
 * Returns the current AuthState. Must be used inside AuthProvider.
 */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
