'use client';

import { useEffect, useState } from 'react';

const MESSAGES = ['Checking your session…', 'Loading your job search…', 'Almost there…'];

/**
 * Branded start-up screen shown while Firebase restores the session.
 * Fades in after a short delay so instant loads never flash it.
 */
export function Splash({ message }: { message?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (message) return;
    const t = setInterval(() => setI((n) => Math.min(n + 1, MESSAGES.length - 1)), 1600);
    return () => clearInterval(t);
  }, [message]);

  return (
    <div className="splash fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-bg" role="status" aria-live="polite" aria-label="Loading ZiPilot">
      {/* Ambient brand glow */}
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-[38%] left-[58%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col items-center">
        {/* Logo with orbiting gradient ring + breathing glow */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span aria-hidden className="splash-glow absolute inset-3 rounded-[22px] bg-indigo-500/40 blur-xl" />
          <span aria-hidden className="splash-ring absolute inset-0 rounded-full" />
          <span aria-hidden className="absolute inset-[5px] rounded-full bg-bg" />
          <svg viewBox="0 0 64 64" className="splash-logo relative h-12 w-12 drop-shadow-[0_6px_18px_rgb(99_102_241/0.55)]" aria-hidden>
            <defs>
              <linearGradient id="splash-logo-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#splash-logo-grad)" />
            <path className="splash-z" d="M18 20h28L22 44h24" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="46" cy="20" r="4" fill="#fff" />
          </svg>
        </div>

        <p className="font-display mt-6 text-2xl font-extrabold tracking-tight text-fg">
          Zi<span className="text-accent">Pilot</span>
        </p>

        {/* Indeterminate progress track */}
        <div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-surface-3">
          <div className="splash-bar bg-brand h-full w-1/3 rounded-full" />
        </div>

        <p key={message ?? i} className="splash-msg mt-3 h-4 text-xs font-medium text-muted">
          {message ?? MESSAGES[i]}
        </p>
      </div>
    </div>
  );
}
