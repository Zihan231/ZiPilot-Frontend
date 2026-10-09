'use client';

import { X } from 'lucide-react';
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './ui';

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

function useBodyLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEscape(open, onClose);
  useBodyLock(open);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            'animate-pop flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-pop sm:rounded-2xl',
            size === 'sm' && 'sm:max-w-md',
            size === 'md' && 'sm:max-w-lg',
            size === 'lg' && 'sm:max-w-2xl',
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">{title}</h2>
              {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
            </div>
            <button onClick={onClose} className="-m-1 rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

/** Right-side drawer on desktop, fullscreen sheet on mobile. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEscape(open, onClose);
  useBodyLock(open);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onMouseDown={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.stopPropagation()}
          className="animate-drawer flex h-full w-full flex-col border-l border-line bg-surface shadow-pop sm:max-w-md"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <div className="text-base font-semibold">{title}</div>
            <button onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

// ── Popover ──
const PopoverCtx = createContext<{ close: () => void }>({ close: () => {} });
export const usePopover = () => useContext(PopoverCtx);

/**
 * Lightweight anchored popover rendered in a portal with fixed positioning,
 * so it never gets clipped by scroll containers or tables.
 */
export function Popover({
  trigger,
  children,
  align = 'start',
  className,
  width,
  anchorClassName = 'inline-flex',
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: 'start' | 'end';
  className?: string;
  width?: number;
  /** Classes for the element wrapping the trigger (e.g. 'flex w-full' for full-width triggers). */
  anchorClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; maxH: number } | null>(null);
  const close = () => setOpen(false);
  useEscape(open, close);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const a = anchor.current?.getBoundingClientRect();
      if (!a) return;
      const w = panel.current?.offsetWidth ?? width ?? 220;
      const h = panel.current?.offsetHeight ?? 200;
      let left = align === 'end' ? a.right - w : a.left;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      const below = window.innerHeight - a.bottom - 8;
      const placeAbove = below < Math.min(h, 260) && a.top > below;
      const top = placeAbove ? Math.max(8, a.top - 6 - Math.min(h, a.top - 16)) : a.bottom + 6;
      const maxH = placeAbove ? a.top - 16 : below - 6;
      setPos({ top, left, maxH });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, align, width]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !anchor.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <>
      <span ref={anchor} className={anchorClassName}>
        {trigger({ open, toggle: () => setOpen((o) => !o) })}
      </span>
      {open && (
        <Portal>
          <PopoverCtx.Provider value={{ close }}>
            <div
              ref={panel}
              style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width, maxHeight: pos ? Math.max(160, pos.maxH) : undefined }}
              className={cn('animate-pop fixed z-[60] overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-pop', className)}
            >
              {typeof children === 'function' ? children(close) : children}
            </div>
          </PopoverCtx.Provider>
        </Portal>
      )}
    </>
  );
}

export function MenuItem({
  children,
  onSelect,
  icon,
  danger,
  active,
  href,
  external,
  disabled,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  active?: boolean;
  href?: string;
  external?: boolean;
  disabled?: boolean;
}) {
  const { close } = usePopover();
  const cls = cn(
    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0',
    danger ? 'text-critical hover:bg-critical-soft' : 'text-fg hover:bg-surface-2',
    active && 'bg-surface-2 font-medium',
    disabled && 'pointer-events-none opacity-40',
  );
  if (href)
    return (
      <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className={cls} onClick={close}>
        {icon}
        {children}
      </a>
    );
  return (
    <button
      type="button"
      className={cls}
      onClick={() => {
        onSelect?.();
        close();
      }}
    >
      {icon}
      {children}
    </button>
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">{children}</div>;
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-line" />;
}
