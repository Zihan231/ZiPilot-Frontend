import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase web config is public by design (security comes from Auth + backend token checks),
// so it ships as a default. NEXT_PUBLIC_FIREBASE_* variables can still override it.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAETnDBeETQiw88bgwZ-K-8T-E39wSREDM',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'zipilot24x7.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'zipilot24x7',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'zipilot24x7.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '107930667668',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:107930667668:web:1f173d1b0dada1270ac281',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-8MP054ZS1W',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/** Analytics only runs in supported browsers. */
export async function initAnalytics() {
  if (typeof window === 'undefined' || !firebaseConfig.measurementId) return;
  const { getAnalytics, isSupported } = await import('firebase/analytics');
  if (await isSupported()) getAnalytics(firebaseApp);
}
