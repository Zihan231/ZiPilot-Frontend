'use client';

import { CalendarRange } from 'lucide-react';
import { useState } from 'react';
import { fmtDate } from '@/lib/format';
import type { RangeInfo } from '@/lib/types';
import { Popover } from '../ui/overlay';
import { Button, cn, Input } from '../ui/ui';

export const RANGE_OPTIONS = [
  { value: 'today', label: 'Today', short: 'Today' },
  { value: '7d', label: '7 Days', short: '7D' },
  { value: '30d', label: '30 Days', short: '30D' },
  { value: '90d', label: '90 Days', short: '90D' },
  { value: 'thisYear', label: 'This Year', short: 'YTD' },
  { value: 'all', label: 'All Time', short: 'All' },
];

export interface RangeValue {
  range: string;
  from?: string;
  to?: string;
}

/** Global analytics date selector: presets + custom range. */
export function DateRangePicker({ value, onChange, info }: { value: RangeValue; onChange: (v: RangeValue) => void; info?: RangeInfo }) {
  const [from, setFrom] = useState(value.from ?? '');
  const [to, setTo] = useState(value.to ?? '');
  const isCustom = value.range === 'custom';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="no-scrollbar flex max-w-full overflow-x-auto rounded-lg border border-line bg-surface p-0.5 shadow-card" role="tablist" aria-label="Date range">
        {RANGE_OPTIONS.map((o) => (
          <button
            key={o.value}
            role="tab"
            aria-selected={value.range === o.value}
            onClick={() => onChange({ range: o.value })}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
              value.range === o.value ? 'bg-accent text-accent-ink shadow-sm' : 'text-fg-2 hover:bg-surface-2 hover:text-fg',
            )}
          >
            <span className="sm:hidden">{o.short}</span>
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        ))}
        <Popover
          align="end"
          width={260}
          trigger={({ toggle }) => (
            <button
              onClick={toggle}
              className={cn(
                'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                isCustom ? 'bg-accent text-accent-ink shadow-sm' : 'text-fg-2 hover:bg-surface-2 hover:text-fg',
              )}
            >
              <CalendarRange className="h-3.5 w-3.5" /> Custom
            </button>
          )}
        >
          {(close) => (
            <div className="space-y-2.5 p-2.5">
              <p className="text-xs font-semibold">Custom range</p>
              <label className="block text-[11px] text-muted">
                From
                <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-8" />
              </label>
              <label className="block text-[11px] text-muted">
                To
                <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="mt-1 h-8" />
              </label>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                disabled={!from && !to}
                onClick={() => {
                  onChange({ range: 'custom', from: from || undefined, to: to || undefined });
                  close();
                }}
              >
                Apply range
              </Button>
            </div>
          )}
        </Popover>
      </div>
      {info && (
        <span className="text-xs text-muted">
          {info.from || info.to ? (
            <>
              Showing <span className="font-medium text-fg-2">{fmtDate(info.from, 'MMM d')}</span> – <span className="font-medium text-fg-2">{fmtDate(info.to, 'MMM d, yyyy')}</span>
            </>
          ) : (
            <>
              Showing <span className="font-medium text-fg-2">all time</span>
            </>
          )}
        </span>
      )}
    </div>
  );
}

export function rangeFromParams(p: URLSearchParams, fallback = '30d'): RangeValue {
  return { range: p.get('range') || fallback, from: p.get('from') || undefined, to: p.get('to') || undefined };
}

export function rangeToQuery(v: RangeValue): Record<string, string | null> {
  return { range: v.range, from: v.range === 'custom' ? (v.from ?? null) : null, to: v.range === 'custom' ? (v.to ?? null) : null };
}
