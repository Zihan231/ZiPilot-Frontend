'use client';

import { ArrowUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from './ui';

type Fade = 'surface' | 'bg';
const fadeVar: Record<Fade, string> = { surface: 'var(--surface)', bg: 'var(--bg)' };

function useOverflow<T extends HTMLElement>(axis: 'x' | 'y') {
  const ref = useRef<T>(null);
  const [state, setState] = useState({ start: true, end: true, overflow: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const pos = axis === 'x' ? el.scrollLeft : el.scrollTop;
    const size = axis === 'x' ? el.clientWidth : el.clientHeight;
    const total = axis === 'x' ? el.scrollWidth : el.scrollHeight;
    const overflow = total - size > 4;
    // Tolerance absorbs snap/padding offsets so cues only show when real content is hidden.
    setState({ overflow, start: pos <= 8, end: pos + size >= total - 8 });
  }, [axis]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    const mo = new MutationObserver(() => {
      measure();
      Array.from(el.children).forEach((c) => ro.observe(c));
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
      mo.disconnect();
    };
  }, [measure]);

  return { ref, ...state };
}

/**
 * Vertical scroll container with clear affordances:
 * top/bottom fades when content is clipped and a "more below" pill that scrolls on click.
 */
export function ScrollArea({
  children,
  className,
  fade = 'surface',
  moreLabel = 'More below',
}: {
  children: React.ReactNode;
  /** Put the max-height here, e.g. "max-h-[440px]" */
  className?: string;
  fade?: Fade;
  moreLabel?: string;
}) {
  const { ref, start, end, overflow } = useOverflow<HTMLDivElement>('y');
  const color = fadeVar[fade];
  return (
    <div className="relative min-h-0">
      <div ref={ref} className={cn('overflow-y-auto overscroll-contain', className)}>
        {children}
      </div>
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-x-0 top-0 h-6 transition-opacity duration-200', overflow && !start ? 'opacity-100' : 'opacity-0')}
        style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }}
      />
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-14 transition-opacity duration-200', overflow && !end ? 'opacity-100' : 'opacity-0')}
        style={{ background: `linear-gradient(to top, ${color} 25%, transparent)` }}
      />
      {overflow && !end && (
        <button
          type="button"
          onClick={() => ref.current?.scrollBy({ top: ref.current.clientHeight * 0.7, behavior: 'smooth' })}
          className="absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-fg-2 shadow-raised backdrop-blur transition-colors hover:border-accent/40 hover:text-accent"
        >
          {moreLabel} <ChevronDown className="animate-nudge h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/**
 * Horizontal scroller with edge fades and arrow buttons that only appear when there is more content.
 */
export function HScroll({
  children,
  className,
  innerClassName,
  fade = 'surface',
  arrows = true,
  step = 0.8,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  fade?: Fade;
  arrows?: boolean;
  step?: number;
}) {
  const { ref, start, end, overflow } = useOverflow<HTMLDivElement>('x');
  const color = fadeVar[fade];
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * step, behavior: 'smooth' });
  return (
    <div className={cn('relative min-w-0', className)}>
      <div ref={ref} className={cn('no-scrollbar overflow-x-auto scroll-smooth', innerClassName)}>
        {children}
      </div>
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-y-0 left-0 w-10 transition-opacity duration-200', overflow && !start ? 'opacity-100' : 'opacity-0')}
        style={{ background: `linear-gradient(to right, ${color} 20%, transparent)` }}
      />
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-y-0 right-0 w-12 transition-opacity duration-200', overflow && !end ? 'opacity-100' : 'opacity-0')}
        style={{ background: `linear-gradient(to left, ${color} 20%, transparent)` }}
      />
      {arrows && overflow && !start && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="absolute top-1/2 left-0.5 z-[2] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-fg-2 shadow-raised hover:text-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {arrows && overflow && !end && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="absolute top-1/2 right-0.5 z-[2] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-fg-2 shadow-raised hover:text-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Scroll container for wide tables: visible scrollbar, edge shadows and a one-line hint
 * telling the user more columns are available.
 */
export function TableScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, start, end, overflow } = useOverflow<HTMLDivElement>('x');
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.6, behavior: 'smooth' });
  return (
    <div className={cn('relative', className)}>
      {overflow && (
        <div className="flex items-center justify-end gap-1.5 border-b border-line bg-surface-2/60 px-3 py-1 text-[11px] text-muted">
          <span>{end ? 'Scroll left for more columns' : 'More columns →'}</span>
          <button type="button" onClick={() => scroll(-1)} disabled={start} aria-label="Scroll table left" className="rounded p-0.5 hover:bg-surface-3 hover:text-fg disabled:opacity-30">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => scroll(1)} disabled={end} aria-label="Scroll table right" className="rounded p-0.5 hover:bg-surface-3 hover:text-fg disabled:opacity-30">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div ref={ref} className="overflow-x-auto">
        {children}
      </div>
      <div
        aria-hidden
        className={cn('pointer-events-none absolute right-0 bottom-0 w-10 transition-opacity', overflow && !end ? 'opacity-100' : 'opacity-0', overflow ? 'top-[25px]' : 'top-0')}
        style={{ background: 'linear-gradient(to left, rgb(15 23 42 / 0.08), transparent)' }}
      />
      <div
        aria-hidden
        className={cn('pointer-events-none absolute bottom-0 left-0 w-10 transition-opacity', overflow && !start ? 'opacity-100' : 'opacity-0', overflow ? 'top-[25px]' : 'top-0')}
        style={{ background: 'linear-gradient(to right, rgb(15 23 42 / 0.08), transparent)' }}
      />
    </div>
  );
}

/** Thin reading-progress bar that signals page length and position. */
export function ScrollProgress() {
  const [p, setP] = useState(0);
  const [long, setLong] = useState(false);
  useEffect(() => {
    const on = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setLong(max > 120);
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    const ro = new ResizeObserver(on);
    ro.observe(document.body);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      ro.disconnect();
    };
  }, []);
  if (!long) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-transparent" role="progressbar" aria-label="Page scroll position" aria-valuenow={Math.round(p * 100)}>
      <div className="bg-brand h-full origin-left transition-transform duration-75" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

/** Floating button shown after scrolling down a long page. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 700);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={cn(
        'fixed right-4 bottom-36 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-fg-2 shadow-pop transition-all hover:text-accent lg:right-6 lg:bottom-6',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
