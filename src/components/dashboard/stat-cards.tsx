'use client';

import {
  ArrowUpRight,
  Bookmark,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Hourglass,
  MessageSquareReply,
  ScanSearch,
  TrendingUp,
  Trophy,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useId } from 'react';
import type { Hue } from '@/lib/enums';
import { pct } from '@/lib/format';
import type { Analytics, DashboardCard } from '@/lib/types';
import { HScroll } from '../ui/scroll';
import { cn, HUE, IconTile, SectionTitle, Skeleton } from '../ui/ui';

export function cardHref(c: Pick<DashboardCard, 'target' | 'query'>) {
  const qs = new URLSearchParams(c.query).toString();
  return `/${c.target}${qs ? `?${qs}` : ''}`;
}

const PIPELINE: { key: string; hue: Hue; icon: React.ElementType; hint: string }[] = [
  { key: 'awaiting', hue: 'blue', icon: Hourglass, hint: 'No response yet' },
  { key: 'screening', hue: 'violet', icon: ScanSearch, hint: 'Being reviewed' },
  { key: 'interviews', hue: 'indigo', icon: CalendarClock, hint: 'Upcoming' },
  { key: 'offers', hue: 'emerald', icon: Trophy, hint: 'Offers & accepted' },
  { key: 'rejected', hue: 'rose', icon: XCircle, hint: 'Closed' },
];

const TODO: { key: string; hue: Hue; icon: React.ElementType; cta: string }[] = [
  { key: 'followups', hue: 'orange', icon: MessageSquareReply, cta: 'Follow up' },
  { key: 'deadlines', hue: 'amber', icon: Clock, cta: 'Apply soon' },
  { key: 'tasks', hue: 'teal', icon: ClipboardList, cta: 'Complete' },
  { key: 'wishlist', hue: 'violet', icon: Bookmark, cta: 'Review' },
];

function Sparkline({ values }: { values: number[] }) {
  const gid = `spark-${useId().replace(/:/g, '')}`;
  if (values.length < 2) return null;
  const w = 160;
  const h = 44;
  const max = Math.max(1, ...values);
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - (v / max) * (h - 6) - 3] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-40" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

function HeroCard({ total, week, month, rangeLabel, volume }: { total?: DashboardCard; week?: DashboardCard; month?: DashboardCard; rangeLabel?: string; volume?: number[] }) {
  if (!total) return null;
  return (
    <div className="bg-hero relative flex min-w-[260px] flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-raised sm:col-span-2">
      <div className="hero-pattern pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-indigo-200 uppercase">
            <Briefcase className="h-3.5 w-3.5" /> Total applications
          </p>
          <Link href={cardHref(total)} className="group mt-2 flex items-baseline gap-2">
            <span className="font-display tabular text-5xl font-extrabold tracking-tight">{total.count.toLocaleString()}</span>
            <ArrowUpRight className="h-5 w-5 text-indigo-200 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
          <p className="mt-0.5 text-xs text-indigo-200/90">{rangeLabel}</p>
        </div>
        {volume && <Sparkline values={volume} />}
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-2">
        {[week, month].map(
          (c) =>
            c && (
              <Link key={c.key} href={cardHref(c)} className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10 transition-colors ring-inset hover:bg-white/15">
                <p className="text-[11px] font-medium text-indigo-100/90">{c.label}</p>
                <p className="font-display tabular text-xl font-bold">{c.count}</p>
              </Link>
            ),
        )}
      </div>
    </div>
  );
}

function PipelineCard({ card, def, total }: { card: DashboardCard; def: (typeof PIPELINE)[number]; total: number }) {
  const h = HUE[def.hue];
  const share = total && !card.live ? (card.count / total) * 100 : null;
  return (
    <Link
      href={cardHref(card)}
      className="group relative flex min-w-[170px] flex-col overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-raised"
      style={{ borderColor: undefined }}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: h.fg }} />
      <div className="flex items-start justify-between gap-2">
        <IconTile hue={def.hue} size="sm">
          <def.icon />
        </IconTile>
        <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-3 text-[13px] font-semibold text-fg-2">{card.label}</p>
      <p className="font-display tabular mt-0.5 text-3xl font-bold tracking-tight" style={{ color: card.count ? h.fg : undefined }}>
        {card.count.toLocaleString()}
      </p>
      {share !== null ? (
        <div className="mt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full transition-all" style={{ width: `${share}%`, background: h.fg }} />
          </div>
          <p className="mt-1 text-[11px] text-muted">{pct(Math.round(share))} of applications</p>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-muted">{def.hint} · right now</p>
      )}
    </Link>
  );
}

function RateCard({ analytics }: { analytics?: Analytics }) {
  const h = HUE.slate;
  return (
    <Link href="/analytics" className="group relative flex min-w-[170px] flex-col overflow-hidden rounded-2xl border border-dashed border-line-strong bg-surface-2/50 p-4 transition-all hover:-translate-y-0.5 hover:bg-surface hover:shadow-raised">
      <div className="flex items-start justify-between gap-2">
        <IconTile hue="slate" size="sm">
          <TrendingUp />
        </IconTile>
        <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-3 text-[13px] font-semibold text-fg-2">Interview rate</p>
      <p className="font-display tabular mt-0.5 text-3xl font-bold tracking-tight" style={{ color: h.fg }}>
        {analytics ? pct(analytics.conversion.interviewRate) : '—'}
      </p>
      <p className="mt-2 text-[11px] text-muted">{analytics ? `Response rate ${pct(analytics.conversion.responseRate)}` : 'Loading…'}</p>
    </Link>
  );
}

function TodoTile({ card, def, dueNow }: { card: DashboardCard; def: (typeof TODO)[number]; dueNow?: number }) {
  const h = HUE[def.hue];
  const active = card.count > 0;
  return (
    <Link
      href={cardHref(card)}
      className={cn(
        'group relative flex min-w-[160px] flex-col justify-between overflow-hidden rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-raised',
        active ? 'shadow-card' : 'border border-line bg-surface',
      )}
      style={active ? { background: `linear-gradient(145deg, ${h.soft}, var(--surface))`, boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${h.fg} 25%, transparent)` } : undefined}
    >
      <div className="flex items-center justify-between">
        <IconTile hue={def.hue} size="sm" solid={active}>
          <def.icon />
        </IconTile>
        {active ? (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase" style={{ background: h.fg, color: '#fff' }}>
            {def.cta}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-medium text-good">
            <CheckCircle2 className="h-3.5 w-3.5" /> Clear
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="font-display tabular text-3xl font-bold tracking-tight" style={{ color: active ? h.fg : 'var(--muted)' }}>
          {card.count}
        </p>
        <p className="text-[13px] leading-tight font-semibold text-fg-2">{card.label}</p>
        {dueNow ? <p className="mt-1 text-[11px] font-bold" style={{ color: h.fg }}>{dueNow} due today or overdue</p> : null}
      </div>
    </Link>
  );
}

/**
 * Overview KPIs in three visual tiers:
 * 1. hero total (dark brand card)  2. pipeline stages (status colours)  3. to-do items (warm, action-oriented).
 * Every card links to the matching list with identical filters, so counts always agree.
 */
export function StatCards({
  cards,
  rangeLabel,
  loading,
  followUpsDue,
  analytics,
}: {
  cards?: DashboardCard[];
  rangeLabel?: string;
  loading?: boolean;
  followUpsDue?: number;
  analytics?: Analytics;
}) {
  if (loading || !cards) {
    return (
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="col-span-2 h-[176px] rounded-2xl" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[150px] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[150px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }
  const by = (k: string) => cards.find((c) => c.key === k);
  const total = by('total');
  const volume = analytics?.volume.map((v) => v.count);

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section aria-label="Pipeline" className="min-w-0">
        <SectionTitle className="mb-3" hint={rangeLabel}>
          Pipeline
        </SectionTitle>
        {/* Mobile: swipeable row with scroll cues */}
        <HScroll fade="bg" className="sm:hidden" innerClassName="flex snap-x gap-3 pb-1 [&>*]:snap-start">
          <HeroCard total={total} week={by('week')} month={by('month')} rangeLabel={rangeLabel} volume={volume} />
          {PIPELINE.map((d) => by(d.key) && <PipelineCard key={d.key} card={by(d.key)!} def={d} total={total?.count ?? 0} />)}
          <RateCard analytics={analytics} />
        </HScroll>
        <div className="hidden gap-3 sm:grid sm:grid-cols-4">
          <HeroCard total={total} week={by('week')} month={by('month')} rangeLabel={rangeLabel} volume={volume} />
          {PIPELINE.map((d) => by(d.key) && <PipelineCard key={d.key} card={by(d.key)!} def={d} total={total?.count ?? 0} />)}
          <RateCard analytics={analytics} />
        </div>
      </section>
      <section aria-label="To-do" className="min-w-0">
        <SectionTitle className="mb-3" hint="Right now">
          To-do
        </SectionTitle>
        <HScroll fade="bg" className="sm:hidden" innerClassName="flex snap-x gap-3 pb-1 [&>*]:snap-start">
          {TODO.map((d) => by(d.key) && <TodoTile key={d.key} card={by(d.key)!} def={d} dueNow={d.key === 'followups' ? followUpsDue : undefined} />)}
        </HScroll>
        <div className="hidden h-[calc(100%-28px)] gap-3 sm:grid sm:grid-cols-4 xl:grid-cols-2">
          {TODO.map((d) => by(d.key) && <TodoTile key={d.key} card={by(d.key)!} def={d} dueNow={d.key === 'followups' ? followUpsDue : undefined} />)}
        </div>
      </section>
    </div>
  );
}
