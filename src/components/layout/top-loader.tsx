'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { endNavigation, startNavigation, useIsNavigating } from '@/lib/navigation';

/** Ends the navigation state once the new URL has actually rendered. */
function RouteWatcher() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    endNavigation();
  }, [pathname, search]);
  return null;
}

type Phase = 'idle' | 'loading' | 'finishing';

/**
 * One calm page-navigation bar at the top of the window.
 * - Appears only if navigation takes longer than 150ms (fast clicks show nothing).
 * - Glides continuously with a single GPU-accelerated CSS animation (no stepping).
 * - On arrival it eases to 100% from wherever it is, then fades out.
 * Background data refreshes deliberately do NOT trigger it — content areas show their own skeletons.
 */
export function TopLoader() {
  const navigating = useIsNavigating();
  const [phase, setPhase] = useState<Phase>('idle');
  const bar = useRef<HTMLDivElement>(null);

  // Start navigation on any internal link click (capture phase, before Next handles it).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.('a');
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return;
      startNavigation(a.href);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (navigating) {
      if (phase === 'loading') return;
      const t = setTimeout(() => setPhase('loading'), 150);
      return () => clearTimeout(t);
    }
    if (phase !== 'loading') return;
    // Freeze the bar at its current animated position, then ease to full width and fade.
    const el = bar.current;
    if (el) {
      const current = getComputedStyle(el).transform;
      el.style.animation = 'none';
      el.style.transform = current === 'none' ? 'scaleX(0.1)' : current;
      void el.offsetWidth; // commit the frozen position before transitioning
    }
    setPhase('finishing');
    const t = setTimeout(() => setPhase((p) => (p === 'finishing' ? 'idle' : p)), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigating]);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    if (phase === 'finishing') {
      requestAnimationFrame(() => {
        el.style.transition = 'transform 220ms ease-out, opacity 260ms ease 180ms';
        el.style.transform = 'scaleX(1)';
        el.style.opacity = '0';
      });
    }
    if (phase === 'loading') {
      el.style.transition = 'none';
      el.style.transform = '';
      el.style.opacity = '1';
      el.style.animation = '';
    }
  }, [phase]);

  return (
    <>
      <Suspense>
        <RouteWatcher />
      </Suspense>
      {phase !== 'idle' && (
        <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden">
          <div ref={bar} className="nav-progress bg-brand h-full w-full origin-left shadow-[0_0_8px_rgb(99_102_241/0.6)]" />
        </div>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {phase === 'loading' ? 'Loading page…' : ''}
      </span>
    </>
  );
}
