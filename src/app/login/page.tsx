'use client';

import { BarChart3, BellRing, Filter, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Brand } from '@/components/layout/brand';
import { Button, Field, Input } from '@/components/ui/ui';
import { authErrorMessage, useAuth } from '@/lib/auth';

type Mode = 'signin' | 'signup' | 'reset';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, redirectError } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (redirectError) setError(authErrorMessage(redirectError));
  }, [redirectError]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy('email');
    try {
      if (mode === 'signin') await signInWithEmail(email, password);
      if (mode === 'signup') await signUpWithEmail(name, email, password);
      if (mode === 'reset') {
        await resetPassword(email);
        // Firebase hides whether an account exists (email enumeration protection), so word it neutrally.
        toast.success(`If an account exists for ${email}, a reset link is on its way. Check your inbox and spam folder.`, { duration: 8000 });
        setMode('signin');
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function google() {
    setError('');
    setBusy('google');
    try {
      const how = await signInWithGoogle();
      if (how === 'redirect') return; // page is navigating to Google; keep the spinner
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const features = [
    { icon: Target, title: 'Know what needs you today', text: 'Deadlines, follow-ups, interviews and replies in one action center.' },
    { icon: Filter, title: 'Filter anything in seconds', text: '20+ server-side filters, saved presets and shareable URLs.' },
    { icon: BarChart3, title: 'See what is working', text: 'Funnels, conversion rates and which platforms land interviews.' },
    { icon: BellRing, title: 'Never miss a follow-up', text: 'Recruiter outreach tracking from connection to MSG-3.' },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="bg-hero relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="hero-pattern pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-violet-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 -bottom-32 h-[420px] w-[420px] rounded-full bg-sky-500/20 blur-3xl" />
        <Brand inverted />
        <div className="relative max-w-lg">
          <h1 className="text-5xl font-extrabold tracking-tight text-balance">
            Your job search, <span className="bg-gradient-to-r from-indigo-200 to-violet-200 bg-clip-text text-transparent">piloted.</span>
          </h1>
          <p className="mt-4 text-lg text-indigo-100/85">Track every application, wishlist role and recruiter conversation — and know exactly what to do next.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-100 ring-1 ring-white/15 ring-inset">
                  <f.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-indigo-200/80">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-indigo-200/70">© {new Date().getFullYear()} ZiPilot</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <Brand className="mb-10 lg:hidden" />
          <h2 className="text-3xl font-bold tracking-tight">
            {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {mode === 'signin' ? 'Sign in to continue to ZiPilot.' : mode === 'signup' ? 'Start tracking your job search in minutes.' : 'We will email you a reset link.'}
          </p>

          {mode !== 'reset' && (
            <>
              <Button
                className="mt-8 w-full"
                onClick={google}
                loading={busy === 'google' || loading}
                disabled={!!busy || loading}
                title={loading ? 'Preparing secure sign-in…' : undefined}
              >
                {busy !== 'google' && <GoogleIcon />}
                Continue with Google
              </Button>
              <div className="my-6 flex items-center gap-3 text-[11px] font-medium tracking-wide text-muted uppercase">
                <span className="h-px flex-1 bg-line" />
                or with email
                <span className="h-px flex-1 bg-line" />
              </div>
            </>
          )}

          <form onSubmit={submit} className={mode === 'reset' ? 'mt-8 space-y-4' : 'space-y-4'}>
            {mode === 'signup' && (
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" />
              </Field>
            )}
            <Field label="Email">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
            </Field>
            {mode !== 'reset' && (
              <Field label="Password">
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                />
              </Field>
            )}
            {error && <p className="rounded-lg bg-critical-soft px-3 py-2 text-xs text-critical">{error}</p>}
            <Button type="submit" variant="primary" className="w-full" loading={busy === 'email'} disabled={!!busy}>
              {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted">
            {mode === 'signin' && (
              <>
                <button className="hover:text-fg" onClick={() => setMode('reset')}>
                  Forgot password?
                </button>
                <span>
                  New to ZiPilot?{' '}
                  <button className="font-medium text-accent hover:underline" onClick={() => setMode('signup')}>
                    Create an account
                  </button>
                </span>
              </>
            )}
            {mode !== 'signin' && (
              <button className="font-medium text-accent hover:underline" onClick={() => setMode('signin')}>
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
