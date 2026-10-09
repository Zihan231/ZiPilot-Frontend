'use client';

import { Bookmark, ChevronDown, Filter, Plus, Star, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CURRENCIES } from '@/lib/enums';
import { chipLabel, countActive, filterKeys, filterOnly, isActive, type FilterDef, type useUrlFilters } from '@/lib/filters';
import { useDeletePreset, usePresets, useSavePreset } from '@/lib/hooks';
import type { Facets, FilterPreset } from '@/lib/types';
import { OptionList, PillGroup } from '../ui/multi-select';
import { Drawer, MenuItem, MenuLabel, MenuSeparator, Modal, Popover } from '../ui/overlay';
import { Button, cn, Field, Input, Select } from '../ui/ui';

type Url = ReturnType<typeof useUrlFilters>;

/** Debounced text input bound to a URL param. */
export function DebouncedInput({ value, onChange, delay = 300, ...rest }: { value: string; onChange: (v: string) => void; delay?: number } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  useEffect(() => {
    if (v === value) return;
    const t = setTimeout(() => onChange(v), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);
  return <Input value={v} onChange={(e) => setV(e.target.value)} {...rest} />;
}

function facetOptions(def: Extract<FilterDef, { kind: 'multi' }>, facets?: Facets) {
  if (def.options) return def.options;
  if (!def.facet || !facets) return [];
  const f = facets[def.facet];
  if (!f) return [];
  return (f as (string | { value: string; count: number })[]).map((x) => (typeof x === 'string' ? { value: x, label: x } : { value: x.value, label: x.value, count: x.count }));
}

export function FilterControl({ def, url, facets }: { def: FilterDef; url: Url; facets?: Facets }) {
  switch (def.kind) {
    case 'multi': {
      const opts = facetOptions(def, facets);
      const selected = url.getList(def.key);
      const usePills = !def.facet && opts.length <= 8;
      return (
        <div className="space-y-2">
          {usePills ? (
            <PillGroup options={opts} selected={selected} onChange={(v) => url.update({ [def.key]: v })} />
          ) : (
            <div className="rounded-lg border border-line p-1.5">
              <OptionList options={opts} selected={selected} onChange={(v) => url.update({ [def.key]: v })} searchable={def.searchable || opts.length > 8} maxHeight={180} />
            </div>
          )}
          {def.customFrom && selected.includes('custom') && (
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={url.get(def.customFrom)} onChange={(e) => url.update({ [def.customFrom!]: e.target.value })} aria-label="From" />
              <Input type="date" value={url.get(def.customTo!)} onChange={(e) => url.update({ [def.customTo!]: e.target.value })} aria-label="To" />
            </div>
          )}
        </div>
      );
    }
    case 'single': {
      const v = url.get(def.key);
      return <PillGroup multi={false} options={def.options} selected={v ? [v] : []} onChange={(s) => url.update({ [def.key]: s[0] ?? null })} />;
    }
    case 'text':
      return <DebouncedInput value={url.get(def.key)} onChange={(v) => url.update({ [def.key]: v })} placeholder={def.placeholder} />;
    case 'date': {
      const v = url.get(def.key);
      return (
        <div className="space-y-2">
          <PillGroup
            multi={false}
            options={def.options}
            selected={v ? [v] : []}
            onChange={(s) => url.update({ [def.key]: s[0] ?? null, ...(s[0] !== 'custom' ? { [def.fromKey]: null, [def.toKey]: null } : {}) })}
          />
          {v === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={url.get(def.fromKey)} onChange={(e) => url.update({ [def.fromKey]: e.target.value })} aria-label="From" />
              <Input type="date" value={url.get(def.toKey)} onChange={(e) => url.update({ [def.toKey]: e.target.value })} aria-label="To" />
            </div>
          )}
        </div>
      );
    }
    case 'salary': {
      const currencies = Array.from(new Set([...(facets?.currencies ?? []), ...CURRENCIES]));
      return (
        <div className="grid grid-cols-[1fr_1fr_96px] gap-2">
          <DebouncedInput type="number" min={0} placeholder="Min" value={url.get('salaryMin')} onChange={(v) => url.update({ salaryMin: v })} />
          <DebouncedInput type="number" min={0} placeholder="Max" value={url.get('salaryMax')} onChange={(v) => url.update({ salaryMax: v })} />
          <Select value={url.get('currency')} onChange={(v) => url.update({ currency: v })} placeholder="Any" options={currencies.map((c) => ({ value: c, label: c }))} />
        </div>
      );
    }
  }
}

/** Every filter, grouped. Right drawer on desktop, fullscreen on mobile. */
export function FilterDrawer({ open, onClose, defs, url, facets, total, fetching }: { open: boolean; onClose: () => void; defs: FilterDef[]; url: Url; facets?: Facets; total?: number; fetching?: boolean }) {
  const groups = useMemo(() => {
    const m = new Map<string, FilterDef[]>();
    for (const d of defs) m.set(d.group, [...(m.get(d.group) ?? []), d]);
    return [...m.entries()];
  }, [defs]);
  const active = countActive(defs, url.params);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filters
          {active > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] text-white">{active}</span>}
        </span>
      }
      footer={
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => url.clear()} disabled={!active}>
            Clear all
          </Button>
          <Button variant="primary" className="flex-1" onClick={onClose} loading={fetching}>
            Show {total !== undefined ? total.toLocaleString() : ''} results
          </Button>
        </div>
      }
    >
      <div className="divide-y divide-line">
        {groups.map(([group, items]) => (
          <details key={group} open className="group px-5 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
              {group}
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2 space-y-4">
              {items.map((d) => (
                <div key={d.key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={cn('text-[13px] font-medium', isActive(d, url.params) ? 'text-accent' : 'text-fg')}>{d.label}</span>
                    {isActive(d, url.params) && (
                      <button className="text-[11px] text-muted hover:text-fg" onClick={() => url.update(Object.fromEntries(filterKeys(d).map((k) => [k, null])))}>
                        Clear
                      </button>
                    )}
                  </div>
                  <FilterControl def={d} url={url} facets={facets} />
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </Drawer>
  );
}

/** Removable chips for every active filter. */
export function FilterChips({ defs, url, facets, total, extra }: { defs: FilterDef[]; url: Url; facets?: Facets; total?: number; extra?: React.ReactNode }) {
  const active = defs.filter((d) => isActive(d, url.params));
  const q = url.get('q');
  if (!active.length && !q) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {q && (
        <Chip label="Search" value={`“${q}”`} onRemove={() => url.update({ q: null })} />
      )}
      {active.map((d) => (
        <Chip key={d.key} label={d.label} value={chipLabel(d, url.params, facets)} onRemove={() => url.update(Object.fromEntries(filterKeys(d).map((k) => [k, null])))} />
      ))}
      {extra}
      <button onClick={() => url.clear()} className="ml-1 text-xs font-medium text-muted hover:text-critical">
        Clear all filters
      </button>
      {total !== undefined && <span className="ml-auto text-xs text-muted tabular">{total.toLocaleString()} results</span>}
    </div>
  );
}

function Chip({ label, value, onRemove }: { label: string; value: string; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-accent/25 bg-accent-soft py-0.5 pr-1 pl-2.5 text-xs text-accent">
      <span className="font-medium">{label}:</span>
      <span className="truncate">{value}</span>
      <button onClick={onRemove} className="rounded-full p-0.5 hover:bg-accent/15" aria-label={`Remove ${label} filter`}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/** Default + saved named filter presets. */
export function PresetsMenu({ scope, defaults, url }: { scope: FilterPreset['scope']; defaults: { name: string; query: string }[]; url: Url }) {
  const { data: saved = [] } = usePresets(scope);
  const save = useSavePreset();
  const del = useDeletePreset();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const current = filterOnly(url.qs);
  const keep = (q: string) => {
    const p = new URLSearchParams(q);
    for (const k of ['sort', 'dir', 'pageSize', 'state']) {
      const v = url.params.get(k);
      if (v && !p.has(k)) p.set(k, v);
    }
    return p.toString();
  };
  const activeName = [...defaults, ...saved].find((p) => filterOnly(p.query) === current && current)?.name;

  return (
    <>
      <Popover
        width={250}
        trigger={({ toggle }) => (
          <Button size="sm" onClick={toggle}>
            <Bookmark className="h-3.5 w-3.5" />
            <span className="max-w-[120px] truncate">{activeName ?? 'Presets'}</span>
            <ChevronDown className="h-3 w-3 text-muted" />
          </Button>
        )}
      >
        <MenuLabel>Quick views</MenuLabel>
        {defaults.map((p) => (
          <MenuItem key={p.name} icon={<Star />} active={filterOnly(p.query) === current} onSelect={() => url.setAll(keep(p.query))}>
            {p.name}
          </MenuItem>
        ))}
        {saved.length > 0 && (
          <>
            <MenuSeparator />
            <MenuLabel>Saved presets</MenuLabel>
            {saved.map((p) => (
              <div key={p.id} className="group flex items-center">
                <div className="min-w-0 flex-1">
                  <MenuItem icon={<Bookmark />} active={filterOnly(p.query) === current} onSelect={() => url.setAll(keep(p.query))}>
                    <span className="truncate">{p.name}</span>
                  </MenuItem>
                </div>
                <button
                  onClick={() => del.mutate(p.id)}
                  className="mr-1 rounded p-1 text-muted opacity-0 group-hover:opacity-100 hover:text-critical"
                  aria-label={`Delete preset ${p.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </>
        )}
        <MenuSeparator />
        <MenuItem icon={<Plus />} disabled={!current} onSelect={() => setNaming(true)}>
          Save current filters…
        </MenuItem>
      </Popover>
      <Modal
        open={naming}
        onClose={() => setNaming(false)}
        title="Save filter preset"
        size="sm"
        footer={
          <>
            <Button onClick={() => setNaming(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!name.trim()}
              loading={save.isPending}
              onClick={() =>
                save.mutate(
                  { scope, name: name.trim(), query: current },
                  {
                    onSuccess: () => {
                      setNaming(false);
                      setName('');
                    },
                  },
                )
              }
            >
              Save preset
            </Button>
          </>
        }
      >
        <Field label="Preset name">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Remote frontend roles" maxLength={60} />
        </Field>
        <p className="mt-2 text-xs break-all text-muted">{current.replace(/&/g, ' · ')}</p>
      </Modal>
    </>
  );
}
