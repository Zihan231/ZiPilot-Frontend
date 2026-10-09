'use client';

import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, googleProvider, initAnalytics } from './firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  /** Resolves to 'redirect' when the browser blocked the popup and a full-page redirect started. */
  signInWithGoogle: () => Promise<'popup' | 'redirect'>;
  /** Error from a completed redirect sign-in (shown once on the login page). */
  redirectError: unknown;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<unknown>(null);

  useEffect(() => {
    initAnalytics().catch(() => {});
    // Completes a redirect-based Google sign-in (the fallback when popups are blocked).
    getRedirectResult(auth).catch((e) => setRedirectError(e));
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
        try {
          await signInWithPopup(auth, googleProvider);
          return 'popup';
        } catch (e) {
          const code = (e as { code?: string }).code;
          // Popup blocked (strict browsers, in-app browsers): fall back to a full-page redirect.
          if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
            await signInWithRedirect(auth, googleProvider);
            return 'redirect';
          }
          throw e;
        }
      },
      redirectError,
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
    [user, loading, redirectError],
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
    'auth/popup-closed-by-user': 'The Google sign-in window was closed before finishing.',
    'auth/cancelled-popup-request': 'Another sign-in window is already open.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.',
    'auth/network-request-failed': 'Network error — check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase.',
    'auth/unauthorized-domain': `Google sign-in isn't enabled for ${typeof window !== 'undefined' ? window.location.hostname : 'this site'} yet. Add it in Firebase → Authentication → Settings → Authorized domains.`,
  };
  return map[code] ?? (err as Error)?.message ?? 'Something went wrong.';
}
