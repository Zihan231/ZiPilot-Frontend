'use client';

import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { APPLIED_VIA_OPTIONS, appliedViaLabel, PLATFORM_OPTIONS, platformLabel } from '@/lib/enums';
import { useCustomOptions, useSaveCustomOptions } from '@/lib/hooks';
import { Popover } from './overlay';
import { cn } from './ui';

type Kind = 'platform' | 'appliedVia';

const BUILT_IN = { platform: PLATFORM_OPTIONS, appliedVia: APPLIED_VIA_OPTIONS };
const LABEL = { platform: platformLabel, appliedVia: appliedViaLabel };
const NOUN = { platform: 'platform', appliedVia: 'method' };

/**
 * Select for Platform / Applied via that also lets the user add their own options.
 * Custom options are saved to the account (PUT /me/options) and appear in every form.
 */
export function OptionPicker({
  kind,
  value,
  onChange,
  allowEmpty,
  placeholder = 'Select…',
}: {
  kind: Kind;
  value: string;
  onChange: (v: string) => void;
  allowEmpty?: boolean;
  placeholder?: string;
}) {
  const custom = useCustomOptions()[kind];
  const all = useCustomOptions();
  const save = useSaveCustomOptions();
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const builtIn = BUILT_IN[kind];
  const needle = q.trim().toLowerCase();
  const match = (label: string) => !needle || label.toLowerCase().includes(needle);
  const exists = useMemo(
    () => [...builtIn.map((o) => o.label), ...builtIn.map((o) => o.value), ...custom].some((v) => v.toLowerCase() === needle),
    [builtIn, custom, needle],
  );
  // A value that's neither built-in nor saved (e.g. an option that was later removed) still shows.
  const orphan = value && !builtIn.some((o) => o.value === value) && !custom.includes(value) ? value : null;

  const add = (close: () => void) => {
    const text = q.trim().replace(/\s+/g, ' ').slice(0, 60);
    if (!text) return;
    save.mutate({ ...all, [kind]: [...custom, text] });
    onChange(text);
    setQ('');
    close();
  };
  const remove = (opt: string) => save.mutate({ ...all, [kind]: custom.filter((c) => c !== opt) });

  const row = (val: string, label: string, close: () => void, removable?: boolean) => (
    <div key={val} className="group flex items-center">
      <button
        type="button"
        onClick={() => {
          onChange(val);
          setQ('');
          close();
        }}
        className={cn('flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-surface-2', value === val && 'bg-surface-2 font-semibold')}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {value === val && <Check className="h-3.5 w-3.5 shrink-0 text-accent" />}
      </button>
      {removable && (
        <button
          type="button"
          onClick={() => remove(val)}
          className="mr-1 rounded p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-critical-soft hover:text-critical focus:opacity-100"
          aria-label={`Remove “${label}” from your options`}
          title="Remove from your options"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const builtInShown = builtIn.filter((o) => match(o.label));
  const customShown = custom.filter(match);

  return (
    <Popover
      width={280}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={() => {
            toggle();
            setTimeout(() => input.current?.focus(), 30);
          }}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 text-left text-sm shadow-[inset_0_1px_1px_rgb(15_23_42/0.03)] transition-colors hover:border-line-strong',
            open && 'border-accent ring-4 ring-accent/15',
          )}
          aria-haspopup="listbox"
        >
          <span className={cn('truncate', !value && 'text-muted/80')}>{value ? LABEL[kind](value) : placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        </button>
      )}
    >
      {(close) => (
        <div className="p-1">
          <div className="relative mb-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (needle && !exists) add(close);
                  else if (builtInShown[0]) {
                    onChange(builtInShown[0].value);
                    close();
                  } else if (customShown[0]) {
                    onChange(customShown[0]);
                    close();
                  }
                }
              }}
              placeholder={`Search or add a ${NOUN[kind]}…`}
              className="h-8 w-full rounded-lg border border-line bg-surface pr-2 pl-8 text-[13px] focus:border-accent focus:outline-none"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {allowEmpty && !needle && row('', 'Not set', close)}
            {orphan && match(orphan) && row(orphan, orphan, close)}

            {customShown.length > 0 && (
              <>
                <p className="px-2.5 pt-2 pb-1 text-[10px] font-bold tracking-[0.08em] text-muted uppercase">Your options</p>
                {customShown.map((c) => row(c, c, close, true))}
              </>
            )}

            {builtInShown.length > 0 && (
              <>
                <p className="px-2.5 pt-2 pb-1 text-[10px] font-bold tracking-[0.08em] text-muted uppercase">Built-in</p>
                {builtInShown.map((o) => row(o.value, o.label, close))}
              </>
            )}

            {needle && !exists && (
              <button
                type="button"
                onClick={() => add(close)}
                className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-accent/40 bg-accent-soft/50 px-2.5 py-2 text-left text-[13px] font-medium text-accent hover:bg-accent-soft"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  Add “{q.trim()}” as a new {NOUN[kind]}
                </span>
              </button>
            )}
            {!needle && custom.length === 0 && (
              <p className="px-2.5 pt-2 pb-1 text-[11px] text-muted">Tip: type a name to add your own {NOUN[kind]}.</p>
            )}
          </div>
        </div>
      )}
    </Popover>
  );
}
