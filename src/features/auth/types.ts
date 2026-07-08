import type { User } from 'firebase/auth';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthorized: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
