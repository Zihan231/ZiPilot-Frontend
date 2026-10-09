'use client';

import { useRouter as useNextRouter } from 'next/navigation';
import { useMemo, useSyncExternalStore } from 'react';

/**
 * Tiny global store for "a route transition is in progress".
 * The App Router has no navigation-start event, so links (via a document click listener in
 * <TopLoader/>) and programmatic pushes (via the wrapped useRouter below) announce it here,
 * and <TopLoader/> clears it once the new URL has rendered.
 */
let navigating = false;
let safety: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function currentUrl() {
  return typeof window === 'undefined' ? '' : window.location.pathname + window.location.search;
}

export function startNavigation(href?: string) {
  if (typeof window === 'undefined') return;
  if (href) {
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname + url.search === currentUrl()) return; // same page (e.g. hash link)
    } catch {
      return;
    }
  }
  navigating = true;
  clearTimeout(safety);
  safety = setTimeout(endNavigation, 15000); // never get stuck
  emit();
}

export function endNavigation() {
  clearTimeout(safety);
  if (!navigating) return;
  navigating = false;
  emit();
}

export function useIsNavigating() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => navigating,
    () => false,
  );
}

/** Drop-in replacement for next/navigation's useRouter whose push() shows the loading bar. */
export function useRouter() {
  const router = useNextRouter();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) => {
        startNavigation(href);
        router.push(href, options);
      },
    }),
    [router],
  );
}
