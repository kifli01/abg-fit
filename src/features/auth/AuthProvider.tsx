import React, { createContext, useCallback, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import type { AuthState } from './types';

export const AuthContext = createContext<AuthState | null>(null);

const googleProvider = new GoogleAuthProvider();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check Firestore allowedAccounts, derive admin role, and upsert user profile.
  const checkAllowlistAndUpsert = useCallback(
    async (firebaseUser: User): Promise<{ authorized: boolean; admin: boolean }> => {
      const email = firebaseUser.email;
      if (!email) return { authorized: false, admin: false };

      const allowRef = doc(db, 'allowedAccounts', email);
      const allowSnap = await getDoc(allowRef);

      if (!allowSnap.exists() || allowSnap.data()?.active !== true) {
        return { authorized: false, admin: false };
      }

      // Derive admin flag from the allowedAccounts document role field.
      const role = allowSnap.data()?.role as string | undefined;
      const admin = role === 'admin';

      // Authorized — upsert users/{uid}.
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email,
          displayName: firebaseUser.displayName ?? null,
          photoURL: firebaseUser.photoURL ?? null,
          provider: 'google',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      } else {
        await setDoc(
          userRef,
          { lastLoginAt: serverTimestamp() },
          { merge: true }
        );
      }

      return { authorized: true, admin };
    },
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsAuthorized(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { authorized, admin } = await checkAllowlistAndUpsert(firebaseUser);
        if (authorized) {
          setUser(firebaseUser);
          setIsAuthorized(true);
          setIsAdmin(admin);
          setAuthError(null);
        } else {
          await firebaseSignOut(auth);
          setUser(null);
          setIsAuthorized(false);
          setIsAdmin(false);
          setAuthError('This Google account is not authorized for abgFit.');
        }
      } catch (err) {
        console.error('Auth allowlist check failed:', err);
        await firebaseSignOut(auth).catch(() => undefined);
        setUser(null);
        setIsAuthorized(false);
        setIsAdmin(false);
        setAuthError('Authentication error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [checkAllowlistAndUpsert]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setIsLoading(false);
        return;
      }
      console.error('Google sign-in failed:', err);
      setAuthError('Sign-in failed. Please try again.');
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthorized, isAdmin, authError, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
