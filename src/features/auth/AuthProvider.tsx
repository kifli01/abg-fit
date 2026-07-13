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

  // Check Firestore allowedAccounts and upsert user profile for authorized users.
  const checkAllowlistAndUpsert = useCallback(async (
    firebaseUser: User,
  ): Promise<{ authorized: boolean; isAdmin: boolean }> => {
    const email = firebaseUser.email;
    if (!email) {
      return { authorized: false, isAdmin: false };
    }

    const allowRef = doc(db, 'allowedAccounts', email);
    const allowSnap = await getDoc(allowRef);

    const data = allowSnap.data();
    const authorized = data?.active === true;
    const role = data?.role;
    const isAdmin = role === 'owner';

    if (!authorized) {
      return { authorized: false, isAdmin: false };
    }

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

    return { authorized: true, isAdmin };
  }, []);

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
        const result = await checkAllowlistAndUpsert(firebaseUser);
        if (result.authorized) {
          setUser(firebaseUser);
          setIsAuthorized(true);
          setIsAdmin(result.isAdmin);
          setAuthError(null);
        } else {
          // Sign out unauthorized users immediately.
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
      // onAuthStateChanged will handle the rest.
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User dismissed the popup — not an error worth surfacing.
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
    // onAuthStateChanged will reset state.
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthorized, isAdmin, authError, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
