'use client';

import clsx, { type ClassValue } from 'clsx';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { forwardRef } from 'react';
import type { Tone } from '@/lib/enums';

export const cn = (...c: ClassValue[]) => clsx(c);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
type ButtonSize = 'xs' | 'sm' | 'md' | 'icon' | 'icon-sm';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-strong shadow-card',
  secondary: 'bg-surface text-fg border border-line hover:bg-surface-2 shadow-card',
  ghost: 'text-fg-2 hover:bg-surface-2 hover:text-fg',
  danger: 'bg-critical text-white hover:opacity-90',
  soft: 'bg-accent-soft text-accent hover:brightness-95',
};
const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2 text-xs gap-1 rounded-md',
  sm: 'h-8 px-2.5 text-[13px] gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  icon: 'h-9 w-9 rounded-lg',
  'icon-sm': 'h-7 w-7 rounded-md',
};

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors select-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none',
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

export function LinkButton({
  href,
  variant = 'secondary',
  size = 'md',
  className,
  children,
  external,
  ...rest
}: { href: string; variant?: ButtonVariant; size?: ButtonSize; className?: string; children: React.ReactNode; external?: boolean; title?: string }) {
  if (external)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)} {...rest}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface shadow-card', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  icon,
  count,
  action,
  subtitle,
  className,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-4 pt-4 pb-3', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
          <h2 className="truncate text-sm font-semibold text-fg">{title}</h2>
          {count !== undefined && <span className="tabular rounded-full bg-surface-2 px-1.5 py-px text-[11px] font-medium text-fg-2">{count}</span>}
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-fg-2 ring-line',
  info: 'bg-info-soft text-info ring-info/15',
  accent: 'bg-accent-soft text-accent ring-accent/20',
  violet: 'bg-violet-soft text-violet ring-violet/15',
  good: 'bg-good-soft text-good ring-good/15',
  warn: 'bg-warn-soft text-warn ring-warn/15',
  serious: 'bg-serious-soft text-serious ring-serious/15',
  critical: 'bg-critical-soft text-critical ring-critical/15',
};

export function Badge({ tone = 'neutral', className, children, dot }: { tone?: Tone; className?: string; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset', tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const fieldBase =
  'w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15 disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(fieldBase, 'h-9', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, 'min-h-24 py-2 leading-relaxed', className)} {...rest} />;
});

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
  size = 'md',
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'size'>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(fieldBase, size === 'sm' ? 'h-8 pr-7 text-[13px]' : 'h-9 pr-8', 'cursor-pointer appearance-none bg-[length:16px] bg-[right_8px_center] bg-no-repeat', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237d7c77' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...rest}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Field({ label, hint, children, className, required }: { label: string; hint?: string; children: React.ReactNode; className?: string; required?: boolean }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-medium text-fg-2">
        {label}
        {required && <span className="text-critical"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export function Checkbox({ checked, onChange, label, className, indeterminate }: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; className?: string; indeterminate?: boolean }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm', className)} onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        className="h-4 w-4 cursor-pointer rounded border-line-strong accent-[var(--accent)]"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = !!indeterminate;
        }}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm text-fg-2"
    >
      <span className={cn('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-surface-3')}>
        <span className={cn('absolute top-0.5 left-0 h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4.5' : 'translate-x-0.5')} />
      </span>
      {label}
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />;
}

export function SkeletonRows({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2.5 p-4', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, description, action, compact }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-6' : 'px-6 py-14')}>
      {icon && <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted [&>svg]:h-5 [&>svg]:w-5">{icon}</div>}
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin text-muted', className)} />;
}

export function CompanyAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const hues = [215, 25, 160, 265, 340, 190, 45, 120];
  const h = hues[hash % hues.length];
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-lg font-semibold', size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs')}
      style={{ background: `hsl(${h} 70% 50% / 0.14)`, color: `hsl(${h} 65% 42%)` }}
      aria-hidden
    >
      {initials || '?'}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-line bg-surface-2 px-1.5 py-px font-sans text-[10px] font-medium text-muted">{children}</kbd>;
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-[11px] font-semibold tracking-wide text-muted uppercase', className)}>{children}</h3>;
}
