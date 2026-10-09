import { useId } from 'react';
import { cn } from '../ui/ui';

export function Logo({ className }: { className?: string }) {
  // Unique gradient id: duplicate ids break when the first instance is display:none (e.g. hidden sidebar).
  const id = `zp-logo-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 64 64" className={cn('h-8 w-8', className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id})`} />
      <path d="M18 20h28L22 44h24" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="46" cy="20" r="4" fill="#fff" />
    </svg>
  );
}

export function Brand({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <Logo />
      <span className={cn('font-display text-[17px] font-bold tracking-tight', inverted && 'text-white')}>
        Zi<span className={inverted ? 'text-indigo-300' : 'text-accent'}>Pilot</span>
      </span>
    </span>
  );
}
