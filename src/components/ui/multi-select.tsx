'use client';

import { Check, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Option } from '@/lib/enums';
import { cn } from './ui';

/** Inline checkbox list with optional search — used inside filter drawers and popovers. */
export function OptionList({
  options,
  selected,
  onChange,
  searchable,
  emptyText = 'No options yet',
  maxHeight = 220,
}: {
  options: (Option & { count?: number })[];
  selected: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  emptyText?: string;
  maxHeight?: number;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;
  }, [options, q]);
  const set = new Set(selected);
  const toggle = (v: string) => onChange(set.has(v) ? selected.filter((s) => s !== v) : [...selected, v]);

  return (
    <div>
      {searchable && (
        <div className="relative mb-1.5">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="h-8 w-full rounded-lg border border-line bg-surface pr-2 pl-8 text-[13px] focus:border-accent focus:outline-none"
          />
        </div>
      )}
      <div className="space-y-px overflow-y-auto" style={{ maxHeight }}>
        {filtered.length === 0 && <p className="px-2 py-3 text-center text-xs text-muted">{options.length ? 'No matches' : emptyText}</p>}
        {filtered.map((o) => {
          const on = set.has(o.value);
          return (
            <button
              type="button"
              key={o.value}
              onClick={() => toggle(o.value)}
              className={cn('flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-surface-2', on && 'text-fg')}
            >
              <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', on ? 'border-accent bg-accent text-white' : 'border-line-strong')}>
                {on && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {o.count !== undefined && <span className="tabular text-[11px] text-muted">{o.count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Pill-style toggle group for small option sets. */
export function PillGroup({ options, selected, onChange, multi = true }: { options: Option[]; selected: string[]; onChange: (v: string[]) => void; multi?: boolean }) {
  const set = new Set(selected);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = set.has(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              if (multi) onChange(on ? selected.filter((s) => s !== o.value) : [...selected, o.value]);
              else onChange(on ? [] : [o.value]);
            }}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
              on ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface text-fg-2 hover:border-line-strong hover:text-fg',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
