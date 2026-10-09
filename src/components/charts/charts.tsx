'use client';

import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { pct } from '@/lib/format';
import { cn } from '../ui/ui';

const VARS = ['--series-1', '--series-2', '--series-3', '--grid', '--muted', '--fg', '--fg-2', '--surface', '--line', '--ramp-1', '--ramp-2', '--ramp-3', '--ramp-4', '--ramp-5'] as const;
type Colors = Record<(typeof VARS)[number], string>;

/** Reads chart color tokens from CSS and re-reads them when the theme toggles. */
export function useChartColors(): Colors {
  const read = () => {
    const s = typeof window === 'undefined' ? null : getComputedStyle(document.documentElement);
    return Object.fromEntries(VARS.map((v) => [v, s?.getPropertyValue(v).trim() || '#888'])) as Colors;
  };
  const [colors, setColors] = useState<Colors>(() => read());
  useEffect(() => {
    setColors(read());
    const obs = new MutationObserver(() => setColors(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return colors;
}

function TooltipBox({ title, rows }: { title: string; rows: { label: string; value: string | number; color?: string }[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-medium text-fg">{title}</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-fg-2">
          {r.color && <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />}
          <span className="flex-1">{r.label}</span>
          <span className="tabular font-medium text-fg">{r.value}</span>
        </div>
      ))}
      <p className="mt-1 text-[10px] text-muted">Click to view applications</p>
    </div>
  );
}

const bucketLabel = (iso: string, g: 'day' | 'week' | 'month', long = false) => {
  const d = parseISO(iso);
  if (g === 'month') return format(d, long ? 'MMMM yyyy' : 'MMM');
  if (g === 'week') return long ? `Week of ${format(d, 'MMM d, yyyy')}` : format(d, 'MMM d');
  return format(d, long ? 'EEE, MMM d' : 'MMM d');
};

/** Application volume over time — one series, single hue; each bar drills into that period. */
export function VolumeChart({
  data,
  granularity,
  height = 240,
  baseQuery,
}: {
  data: { bucket: string; from: string; to: string; count: number }[];
  granularity: 'day' | 'week' | 'month';
  height?: number;
  baseQuery?: Record<string, string>;
}) {
  const c = useChartColors();
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);
  const open = (from: string, to: string) => {
    const p = new URLSearchParams({ ...(baseQuery ?? {}) });
    p.delete('applied');
    p.delete('appliedFrom');
    p.delete('appliedTo');
    p.set('applied', 'custom');
    p.set('appliedFrom', from);
    p.set('appliedTo', to);
    router.push(`/applications?${p}`);
  };
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} onMouseLeave={() => setHover(null)}>
          <CartesianGrid vertical={false} stroke={c['--grid']} />
          <XAxis
            dataKey="bucket"
            tickFormatter={(v) => bucketLabel(v, granularity)}
            tick={{ fill: c['--muted'], fontSize: 11 }}
            axisLine={{ stroke: c['--line'] }}
            tickLine={false}
            minTickGap={18}
          />
          <YAxis allowDecimals={false} tick={{ fill: c['--muted'], fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            cursor={{ fill: c['--grid'], opacity: 0.6 }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <TooltipBox
                  title={bucketLabel(String(payload[0].payload.bucket), granularity, true)}
                  rows={[{ label: 'Applications', value: Number(payload[0].value), color: c['--series-1'] }]}
                />
              ) : null
            }
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
            cursor="pointer"
            onMouseEnter={(_, i) => setHover(i)}
            onClick={(d) => {
              const row = (d as unknown as { payload: { from: string; to: string } }).payload;
              open(row.from, row.to);
            }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={c['--series-1']} fillOpacity={hover === null || hover === i ? 1 : 0.55} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal magnitude bars in HTML — accessible, clickable rows, single hue. */
export function BarList({
  rows,
  onSelect,
  valueSuffix,
  max: maxProp,
}: {
  rows: { key: string; label: string; value: number; hint?: string }[];
  onSelect?: (key: string) => void;
  valueSuffix?: string;
  max?: number;
}) {
  const max = maxProp ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li key={r.key}>
          <button
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect?.(r.key)}
            className="group grid w-full grid-cols-[minmax(90px,140px)_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors enabled:hover:bg-surface-2"
            title={onSelect ? `View ${r.label} applications` : undefined}
          >
            <span className="truncate text-fg-2 group-hover:text-fg">{r.label}</span>
            <span className="relative h-2.5 overflow-hidden rounded-full bg-surface-2">
              <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--series-1)] transition-all" style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value ? 4 : 0 }} />
            </span>
            <span className="tabular min-w-10 text-right font-medium">
              {r.value}
              {valueSuffix}
              {r.hint && <span className="ml-1 text-[11px] font-normal text-muted">{r.hint}</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Ordinal funnel — one hue, light → dark by stage, with step conversion. */
export function Funnel({ stages, onSelect }: { stages: { stage: string; key: string; count: number }[]; onSelect?: (key: string) => void }) {
  const top = Math.max(1, stages[0]?.count ?? 1);
  const ramp = ['var(--ramp-1)', 'var(--ramp-2)', 'var(--ramp-3)', 'var(--ramp-4)', 'var(--ramp-5)'];
  return (
    <div className="space-y-1.5">
      {stages.map((s, i) => {
        const prev = i > 0 ? stages[i - 1].count : null;
        const step = prev ? (s.count / prev) * 100 : null;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onSelect?.(s.key)}
            className="group grid w-full grid-cols-[84px_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-surface-2"
            title={`View applications that reached ${s.stage}`}
          >
            <span className="text-fg-2 group-hover:text-fg">{s.stage}</span>
            <span className="relative h-6 overflow-hidden rounded-md bg-surface-2">
              <span className="absolute inset-y-0 left-0 rounded-md" style={{ width: `${(s.count / top) * 100}%`, minWidth: s.count ? 4 : 0, background: ramp[i] }} />
            </span>
            <span className="w-24 text-right">
              <span className="tabular font-semibold">{s.count}</span>
              <span className="ml-1.5 text-[11px] text-muted">{step === null ? '100%' : pct(Math.round(step * 10) / 10)}</span>
            </span>
          </button>
        );
      })}
      <p className="px-2 pt-1 text-[11px] text-muted">Percent shows conversion from the previous stage.</p>
    </div>
  );
}

/** Platform performance: total vs interviews — two series, legend + tooltip. */
export function PlatformChart({ data, onSelect }: { data: { key: string; label: string; total: number; interviews: number }[]; onSelect?: (key: string) => void }) {
  const c = useChartColors();
  const height = Math.max(160, data.length * 38 + 40);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barGap={2} barCategoryGap={10}>
          <CartesianGrid horizontal={false} stroke={c['--grid']} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: c['--muted'], fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" width={110} tick={{ fill: c['--fg-2'], fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: c['--grid'], opacity: 0.6 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TooltipBox
                  title={String(payload[0].payload.label)}
                  rows={[
                    { label: 'Applications', value: payload[0].payload.total, color: c['--series-1'] },
                    { label: 'Reached interview', value: payload[0].payload.interviews, color: c['--series-2'] },
                  ]}
                />
              ) : null
            }
          />
          <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 12, color: c['--fg-2'] }} />
          <Bar
            name="Applications"
            dataKey="total"
            fill={c['--series-1']}
            radius={[0, 4, 4, 0]}
            maxBarSize={14}
            cursor="pointer"
            onClick={(d) => onSelect?.((d as unknown as { payload: { key: string } }).payload.key)}
          />
          <Bar
            name="Reached interview"
            dataKey="interviews"
            fill={c['--series-2']}
            radius={[0, 4, 4, 0]}
            maxBarSize={14}
            cursor="pointer"
            onClick={(d) => onSelect?.((d as unknown as { payload: { key: string } }).payload.key)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Part-to-whole for ≤3 categories (Remote / Hybrid / Onsite): donut + legend with values. */
export function Donut({ data, onSelect }: { data: { key: string; label: string; value: number }[]; onSelect?: (key: string) => void }) {
  const c = useChartColors();
  const order = ['--series-1', '--series-2', '--series-3'] as const;
  const total = data.reduce((s, d) => s + d.value, 0);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={data.filter((d) => d.value).length > 1 ? 2 : 0}
              stroke={c['--surface']}
              strokeWidth={2}
              onMouseEnter={(_, i) => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={(d) => onSelect?.((d as unknown as { key: string }).key)}
              cursor="pointer"
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={c[order[i % 3]]} fillOpacity={hover === null || hover === i ? 1 : 0.5} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-xl font-semibold">{hover !== null ? data[hover]?.value : total}</span>
          <span className="text-[11px] text-muted">{hover !== null ? data[hover]?.label : 'total'}</span>
        </div>
      </div>
      <ul className="w-full space-y-1">
        {data.map((d, i) => (
          <li key={d.key}>
            <button
              type="button"
              onClick={() => onSelect?.(d.key)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={cn('flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-surface-2', hover === i && 'bg-surface-2')}
            >
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c[order[i % 3]] }} />
              <span className="flex-1 text-left text-fg-2">{d.label}</span>
              <span className="tabular font-medium">{d.value}</span>
              <span className="tabular w-12 text-right text-[11px] text-muted">{total ? pct(Math.round((d.value / total) * 1000) / 10) : '0%'}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Headline rate — a stat tile rather than a chart. */
export function RateTile({ label, value, detail, onClick }: { label: string; value: number; detail: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="rounded-xl border border-line bg-surface p-4 text-left shadow-card transition-colors enabled:hover:border-line-strong"
    >
      <p className="text-xs font-medium text-fg-2">{label}</p>
      <p className="tabular mt-1.5 text-2xl font-semibold tracking-tight">{pct(value)}</p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-[var(--series-1)]" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-muted">{detail}</p>
    </button>
  );
}
