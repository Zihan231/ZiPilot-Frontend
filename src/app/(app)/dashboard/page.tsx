'use client';

import { Bookmark, CalendarDays, Plus, SlidersHorizontal, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { AttentionCenter } from '@/components/dashboard/attention';
import { CustomizeDialog, DASHBOARD_SECTIONS, normalizeLayout } from '@/components/dashboard/customize';
import { DateRangePicker, rangeFromParams, rangeToQuery } from '@/components/dashboard/date-range';
import {
  FollowUpsTable,
  InterviewsTasksTable,
  RecentActivityCard,
  RecentApplicationsTable,
  StatusCard,
  UpcomingDeadlines,
  VolumeCard,
  WishlistQuickTable,
} from '@/components/dashboard/sections';
import { StatCards } from '@/components/dashboard/stat-cards';
import { Button, cn, SectionTitle } from '@/components/ui/ui';
import { useAuth } from '@/lib/auth';
import { useUrlFilters } from '@/lib/filters';
import { greeting } from '@/lib/format';
import { useAnalytics, useAttention, useMe, useOverview, useSaveLayout } from '@/lib/hooks';
import type { Attention } from '@/lib/types';

/** Human sentence summarising what needs doing — the answer to "what should I do today?". */
function summary(a?: Attention) {
  if (!a) return 'Loading your day…';
  if (!a.total) return 'You’re all caught up. A great time to add a few wishlist jobs or send new applications.';
  const parts: string[] = [];
  const fu = a.followUpsDue.total;
  const dl = a.wishlistDueSoon.total + a.wishlistOverdue.total;
  const iv = a.upcomingInterviews.total;
  const tk = a.pendingTasks.total;
  const rp = a.needsReply.total;
  if (fu) parts.push(`${fu} follow-up${fu > 1 ? 's' : ''} due`);
  if (dl) parts.push(`${dl} deadline${dl > 1 ? 's' : ''} to act on`);
  if (iv) parts.push(`${iv} interview${iv > 1 ? 's' : ''} coming up`);
  if (tk) parts.push(`${tk} assessment${tk > 1 ? 's' : ''} pending`);
  if (rp) parts.push(`${rp} recruiter${rp > 1 ? 's' : ''} waiting on you`);
  if (!parts.length) return `${a.total} items could use a look.`;
  const last = parts.pop();
  return `You have ${parts.length ? `${parts.join(', ')} and ${last}` : last}.`;
}

const GROUP_TITLE: Record<string, string> = {
  attention: 'Today',
  volume: 'Trends',
  recent: 'Quick review',
  followups: 'Outreach & interviews',
  activity: 'History',
};

function Dashboard() {
  const { user } = useAuth();
  const { params, update } = useUrlFilters();
  const range = rangeFromParams(params);
  const rangeQs = new URLSearchParams(Object.entries(rangeToQuery(range)).filter(([, v]) => v) as [string, string][]).toString();

  const overview = useOverview(rangeQs);
  const analytics = useAnalytics(rangeQs);
  const attention = useAttention();
  const me = useMe();
  const saveLayout = useSaveLayout();
  const [customizing, setCustomizing] = useState(false);

  const layout = normalizeLayout(me.data?.dashboardLayout);
  const rangeQuery = analytics.data?.rangeQuery ?? (range.range === 'all' ? {} : { applied: range.range, ...(range.from ? { appliedFrom: range.from } : {}), ...(range.to ? { appliedTo: range.to } : {}) });
  const name = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const today = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });

  const render = (id: string) => {
    switch (id) {
      case 'stats':
        return (
          <StatCards
            cards={overview.data?.cards}
            rangeLabel={overview.data?.range.label}
            loading={overview.isLoading}
            followUpsDue={overview.data?.followUpsDueCount}
            analytics={analytics.data}
          />
        );
      case 'attention':
        return <AttentionCenter />;
      case 'deadlines':
        return <UpcomingDeadlines data={overview.data} loading={overview.isLoading} />;
      case 'volume':
        return <VolumeCard analytics={analytics.data} loading={analytics.isLoading} />;
      case 'status':
        return <StatusCard analytics={analytics.data} loading={analytics.isLoading} />;
      case 'recent':
        return <RecentApplicationsTable data={overview.data} loading={overview.isLoading} rangeQuery={rangeQuery} />;
      case 'wishlist':
        return <WishlistQuickTable data={overview.data} loading={overview.isLoading} />;
      case 'followups':
        return <FollowUpsTable data={overview.data} loading={overview.isLoading} />;
      case 'interviews':
        return <InterviewsTasksTable data={overview.data} loading={overview.isLoading} />;
      case 'activity':
        return <RecentActivityCard />;
    }
  };

  const visible = layout.filter((s) => s.visible);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-hero relative overflow-hidden rounded-3xl px-5 py-6 text-white shadow-raised sm:px-8 sm:py-7">
        <div className="hero-pattern pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-indigo-200 uppercase">
              <CalendarDays className="h-3.5 w-3.5" /> {today}
            </p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting()}, <span className="text-indigo-200">{name}</span>
            </h1>
            <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-indigo-100/90 sm:text-[15px]">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              {summary(attention.data)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/applications/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-indigo-900 shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4" /> Add application
            </Link>
            <Link
              href="/wishlist/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/20 transition ring-inset hover:bg-white/15"
            >
              <Bookmark className="h-4 w-4" /> Save to wishlist
            </Link>
          </div>
        </div>
      </div>

      {/* Toolbar: analytics range + customise */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/70 px-3 py-2.5 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker value={range} info={overview.data?.range} onChange={(v) => update(rangeToQuery(v))} />
        <Button size="sm" variant="ghost" onClick={() => setCustomizing(true)} className="self-start sm:self-auto">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Customize layout
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {visible.map((s, i) => {
          const def = DASHBOARD_SECTIONS.find((d) => d.id === s.id)!;
          // Show a group title before the first half-width section of each row group
          const title = GROUP_TITLE[s.id];
          const showTitle = !!title && isRowStart(visible, i);
          return (
            <div key={s.id} className="contents">
              {showTitle && <SectionTitle className="pt-1 lg:col-span-2">{title}</SectionTitle>}
              <section className={cn('min-w-0', def.span === 'full' && 'lg:col-span-2')} aria-label={def.label}>
                {render(s.id)}
              </section>
            </div>
          );
        })}
      </div>

      <CustomizeDialog
        open={customizing}
        onClose={() => setCustomizing(false)}
        layout={layout}
        saving={saveLayout.isPending}
        onSave={(l) => saveLayout.mutate(l, { onSuccess: () => setCustomizing(false) })}
      />
    </div>
  );
}

/** True when section i begins a new two-column row (so group titles never split a row). */
function isRowStart(visible: { id: string }[], i: number) {
  let col = 0;
  for (let k = 0; k < i; k++) {
    const span = DASHBOARD_SECTIONS.find((d) => d.id === visible[k].id)?.span;
    col = span === 'full' ? 0 : (col + 1) % 2;
  }
  return col === 0;
}

export default function DashboardPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
