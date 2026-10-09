'use client';

import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, googleProvider, initAnalytics } from './firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAnalytics().catch(() => {});
    return onIdTokenChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      signInWithGoogle: async () => {
        await signInWithPopup(auth, googleProvider);
      },
      signInWithEmail: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUpWithEmail: async (name, email, password) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        await cred.user.getIdToken(true);
      },
      resetPassword: (email) => sendPasswordResetEmail(auth, email),
      signOut: () => fbSignOut(auth),
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase Auth settings.',
  };
  return map[code] ?? (err as Error)?.message ?? 'Something went wrong.';
}
