import { cn } from '../ui/ui';

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('h-8 w-8', className)} aria-hidden>
      <rect width="64" height="64" rx="16" fill="var(--accent)" />
      <path d="M18 20h28L22 44h24" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="46" cy="20" r="4" fill="#fff" />
    </svg>
  );
}

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <Logo />
      <span className="text-[15px] font-semibold tracking-tight">ZiPilot</span>
    </span>
  );
}
