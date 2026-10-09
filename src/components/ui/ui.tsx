'use client';

import clsx, { type ClassValue } from 'clsx';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { forwardRef } from 'react';
import type { Hue, Tone } from '@/lib/enums';

export const cn = (...c: ClassValue[]) => clsx(c);

/**
 * Button hierarchy:
 *  primary   – the one main action in a view (brand gradient)
 *  secondary – neutral bordered actions (filters, export)
 *  ghost     – low-emphasis utilities
 *  soft      – contextual brand action inside lists
 *  success   – positive completion (Done, Responded)
 *  danger    – destructive
 *  outline   – emphasised secondary (brand outline)
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'success' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'icon' | 'icon-sm';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white shadow-[0_1px_2px_rgb(79_70_229/0.3),inset_0_1px_0_rgb(255_255_255/0.15)] hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface text-fg border border-line hover:border-line-strong hover:bg-surface-2 shadow-card',
  ghost: 'text-fg-2 hover:bg-surface-2 hover:text-fg',
  danger: 'bg-critical text-white hover:brightness-110 shadow-card',
  soft: 'bg-accent-soft text-accent ring-1 ring-inset ring-accent/20 hover:bg-accent hover:text-white',
  success: 'bg-good-soft text-good ring-1 ring-inset ring-good/25 hover:bg-good hover:text-white',
  outline: 'border border-accent/40 text-accent hover:bg-accent-soft',
};
const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-md',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  icon: 'h-9 w-9 rounded-lg',
  'icon-sm': 'h-7 w-7 rounded-md',
};

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-150 select-none',
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

// ── Hues: each section of the app carries its own colour identity ──
export const HUE: Record<Hue, { fg: string; soft: string }> = {
  indigo: { fg: 'var(--c-indigo)', soft: 'var(--c-indigo-soft)' },
  blue: { fg: 'var(--c-blue)', soft: 'var(--c-blue-soft)' },
  violet: { fg: 'var(--c-violet)', soft: 'var(--c-violet-soft)' },
  teal: { fg: 'var(--c-teal)', soft: 'var(--c-teal-soft)' },
  emerald: { fg: 'var(--c-emerald)', soft: 'var(--c-emerald-soft)' },
  amber: { fg: 'var(--c-amber)', soft: 'var(--c-amber-soft)' },
  orange: { fg: 'var(--c-orange)', soft: 'var(--c-orange-soft)' },
  rose: { fg: 'var(--c-rose)', soft: 'var(--c-rose-soft)' },
  slate: { fg: 'var(--c-slate)', soft: 'var(--c-slate-soft)' },
};

export function IconTile({ hue = 'indigo', children, size = 'md', solid }: { hue?: Hue; children: React.ReactNode; size?: 'sm' | 'md' | 'lg'; solid?: boolean }) {
  const h = HUE[hue];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        size === 'sm' && 'h-7 w-7 rounded-lg [&>svg]:h-3.5 [&>svg]:w-3.5',
        size === 'md' && 'h-8 w-8 rounded-lg [&>svg]:h-4 [&>svg]:w-4',
        size === 'lg' && 'h-10 w-10 rounded-xl [&>svg]:h-5 [&>svg]:w-5',
      )}
      style={solid ? { background: h.fg, color: '#fff' } : { background: h.soft, color: h.fg, boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${h.fg} 18%, transparent)` }}
    >
      {children}
    </span>
  );
}

export function Card({ className, children, hue, ...rest }: React.HTMLAttributes<HTMLDivElement> & { hue?: Hue }) {
  return (
    <div
      className={cn('relative rounded-2xl border border-line bg-surface shadow-card', className)}
      style={hue ? ({ '--card-hue': HUE[hue].fg, '--card-hue-soft': HUE[hue].soft } as React.CSSProperties) : undefined}
      {...rest}
    >
      {hue && <span aria-hidden className="pointer-events-none absolute inset-x-5 top-0 h-[2px] rounded-b-full" style={{ background: HUE[hue].fg, opacity: 0.85 }} />}
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
  hue,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  hue?: Hue;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (hue ? <IconTile hue={hue}>{icon}</IconTile> : <span className="text-muted [&>svg]:h-4 [&>svg]:w-4">{icon}</span>)}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold text-fg">{title}</h2>
            {count !== undefined && (
              <span
                className="tabular rounded-full px-2 py-px text-[11px] font-semibold"
                style={hue ? { background: HUE[hue].soft, color: HUE[hue].fg } : undefined}
              >
                {count}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-fg-2 ring-line-strong/60',
  info: 'bg-info-soft text-info ring-info/20',
  accent: 'bg-accent-soft text-accent ring-accent/25',
  violet: 'bg-violet-soft text-violet ring-violet/20',
  good: 'bg-good-soft text-good ring-good/20',
  warn: 'bg-warn-soft text-warn ring-warn/25',
  serious: 'bg-serious-soft text-serious ring-serious/20',
  critical: 'bg-critical-soft text-critical ring-critical/20',
};

export function Badge({ tone = 'neutral', className, children, dot }: { tone?: Tone; className?: string; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset', tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const fieldBase =
  'w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-muted/80 shadow-[inset_0_1px_1px_rgb(15_23_42/0.03)] transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:opacity-60';

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
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
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
      <span className="mb-1.5 block text-xs font-semibold text-fg-2">
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
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex items-center gap-2.5 text-sm text-fg-2">
      <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-surface-3 ring-1 ring-inset ring-line-strong')}>
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
    <div className={cn('space-y-3 p-4', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact,
  hue = 'slate',
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  hue?: Hue;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-7' : 'px-6 py-16')}>
      {icon && (
        <div className="relative mb-3">
          <span className="absolute inset-0 scale-150 rounded-full opacity-40 blur-md" style={{ background: HUE[hue].soft }} />
          <IconTile hue={hue} size="lg">
            {icon}
          </IconTile>
        </div>
      )}
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">{description}</p>}
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
  const hues = [234, 200, 168, 262, 330, 24, 45, 145];
  const h = hues[hash % hues.length];
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-lg font-semibold', size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-xs')}
      style={{
        background: `linear-gradient(135deg, hsl(${h} 80% 60% / 0.18), hsl(${h + 20} 80% 55% / 0.1))`,
        color: `hsl(${h} 60% 42%)`,
        boxShadow: `inset 0 0 0 1px hsl(${h} 60% 50% / 0.18)`,
      }}
      aria-hidden
    >
      {initials || '?'}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-md border border-line bg-surface px-1.5 py-px font-sans text-[10px] font-semibold text-muted shadow-card">{children}</kbd>;
}

export function SectionTitle({ children, className, hint }: { children: React.ReactNode; className?: string; hint?: React.ReactNode }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <h3 className="text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-muted uppercase">{children}</h3>
      <span className="h-px flex-1 bg-line" />
      {hint && <span className="text-[11px] whitespace-nowrap text-muted">{hint}</span>}
    </div>
  );
}

export function PageHeader({ title, description, icon, hue = 'indigo', actions }: { title: string; description?: React.ReactNode; icon?: React.ReactNode; hue?: Hue; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3.5">
        {icon && (
          <IconTile hue={hue} size="lg" solid>
            {icon}
          </IconTile>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
