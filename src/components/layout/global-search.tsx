'use client';

import { ArrowRight, Bookmark, Briefcase, Loader2, Search, X } from 'lucide-react';
import { useRouter } from '@/lib/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/enums';
import { daysLeft, daysLeftLabel, fmtShort } from '@/lib/format';
import { useSearch } from '@/lib/hooks';
import { Badge, cn, Kbd } from '../ui/ui';

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Highlight({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (!q || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-accent-soft text-accent">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/** Global search across applications + wishlist (company, position, URL, location, recruiter, notes). */
export function GlobalSearch({ autoFocus, onNavigate, className }: { autoFocus?: boolean; onNavigate?: () => void; className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const debounced = useDebounced(q.trim());
  const { data, isFetching } = useSearch(debounced);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/input|textarea|select/i.test((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const items = useMemo(() => {
    if (!data || debounced.length < 2) return [];
    return [
      ...data.applications.map((a) => ({ key: `a-${a.id}`, href: `/applications/${a.id}` })),
      ...(data.totals.applications > data.applications.length ? [{ key: 'all-a', href: `/applications?q=${encodeURIComponent(debounced)}` }] : []),
      ...data.wishlist.map((w) => ({ key: `w-${w.id}`, href: `/wishlist/${w.id}` })),
      ...(data.totals.wishlist > data.wishlist.length ? [{ key: 'all-w', href: `/wishlist?q=${encodeURIComponent(debounced)}&state=all` }] : []),
    ];
  }, [data, debounced]);

  useEffect(() => setActive(0), [debounced]);

  const go = (href: string) => {
    setOpen(false);
    setQ('');
    input.current?.blur();
    onNavigate?.();
    router.push(href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      if (items[active]) go(items[active].href);
      else if (debounced.length >= 2) go(`/applications?q=${encodeURIComponent(debounced)}`);
    } else if (e.key === 'Escape') {
      setOpen(false);
      input.current?.blur();
    }
  };

  const idx = (key: string) => items.findIndex((i) => i.key === key);
  const show = open && q.trim().length >= 2;

  return (
    <div ref={box} className={cn('relative', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={input}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Search company, role, recruiter, notes…"
          className="h-9 w-full rounded-lg border border-line bg-surface-2/60 pr-16 pl-9 text-sm placeholder:text-muted focus:border-accent focus:bg-surface focus:ring-3 focus:ring-accent/15 focus:outline-none"
          aria-label="Global search"
        />
        <div className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-1.5">
          {isFetching && debounced.length >= 2 && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />}
          {q ? (
            <button onClick={() => setQ('')} className="rounded p-0.5 text-muted hover:text-fg" aria-label="Clear search">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-flex">
              <Kbd>Ctrl K</Kbd>
            </span>
          )}
        </div>
      </div>

      {show && (
        <div className="animate-pop absolute top-full right-0 left-0 z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-pop">
          {!data || (isFetching && !data.applications.length && !data.wishlist.length) ? (
            <p className="px-3 py-6 text-center text-xs text-muted">Searching…</p>
          ) : data.applications.length === 0 && data.wishlist.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">No results for “{debounced}”</p>
          ) : (
            <>
              {data.applications.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
                    <span>Applications</span>
                    <span className="tabular">{data.totals.applications}</span>
                  </div>
                  {data.applications.map((a) => (
                    <button
                      key={a.id}
                      onMouseEnter={() => setActive(idx(`a-${a.id}`))}
                      onClick={() => go(`/applications/${a.id}`)}
                      className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left', active === idx(`a-${a.id}`) && 'bg-surface-2')}
                    >
                      <Briefcase className="h-4 w-4 shrink-0 text-muted" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">
                          <Highlight text={a.company} q={debounced} /> · <Highlight text={a.position} q={debounced} />
                        </p>
                        {a.match && !['Company', 'Position'].includes(a.match.field) && (
                          <p className="truncate text-[11px] text-muted">
                            {a.match.field}: <Highlight text={a.match.snippet} q={debounced} />
                          </p>
                        )}
                      </div>
                      <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                    </button>
                  ))}
                  {data.totals.applications > data.applications.length && (
                    <button
                      onMouseEnter={() => setActive(idx('all-a'))}
                      onClick={() => go(`/applications?q=${encodeURIComponent(debounced)}`)}
                      className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent', active === idx('all-a') && 'bg-surface-2')}
                    >
                      View all {data.totals.applications} applications <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
              {data.wishlist.length > 0 && (
                <div className={data.applications.length ? 'mt-1 border-t border-line pt-1' : ''}>
                  <div className="flex items-center justify-between px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
                    <span>Wishlist</span>
                    <span className="tabular">{data.totals.wishlist}</span>
                  </div>
                  {data.wishlist.map((w) => {
                    const dl = daysLeft(w.deadline);
                    return (
                      <button
                        key={w.id}
                        onMouseEnter={() => setActive(idx(`w-${w.id}`))}
                        onClick={() => go(`/wishlist/${w.id}`)}
                        className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left', active === idx(`w-${w.id}`) && 'bg-surface-2')}
                      >
                        <Bookmark className="h-4 w-4 shrink-0 text-muted" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">
                            <Highlight text={w.company} q={debounced} /> · <Highlight text={w.position} q={debounced} />
                          </p>
                          {w.match && !['Company', 'Position'].includes(w.match.field) && (
                            <p className="truncate text-[11px] text-muted">
                              {w.match.field}: <Highlight text={w.match.snippet} q={debounced} />
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] whitespace-nowrap text-muted">
                          {w.appliedAt ? `Applied ${fmtShort(w.appliedAt)}` : daysLeftLabel(dl)}
                        </span>
                      </button>
                    );
                  })}
                  {data.totals.wishlist > data.wishlist.length && (
                    <button
                      onMouseEnter={() => setActive(idx('all-w'))}
                      onClick={() => go(`/wishlist?q=${encodeURIComponent(debounced)}&state=all`)}
                      className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent', active === idx('all-w') && 'bg-surface-2')}
                    >
                      View all {data.totals.wishlist} wishlist jobs <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
