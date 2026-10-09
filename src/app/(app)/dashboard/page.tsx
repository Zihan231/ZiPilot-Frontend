'use client';

import { Bookmark, Plus, SlidersHorizontal } from 'lucide-react';
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
import { GlobalSearch } from '@/components/layout/global-search';
import { Button, cn, LinkButton } from '@/components/ui/ui';
import { useAuth } from '@/lib/auth';
import { useUrlFilters } from '@/lib/filters';
import { greeting } from '@/lib/format';
import { useAnalytics, useMe, useOverview, useSaveLayout } from '@/lib/hooks';

function Dashboard() {
  const { user } = useAuth();
  const { params, update } = useUrlFilters();
  const range = rangeFromParams(params);
  const rangeQs = new URLSearchParams(Object.entries(rangeToQuery(range)).filter(([, v]) => v) as [string, string][]).toString();

  const overview = useOverview(rangeQs);
  const analytics = useAnalytics(rangeQs);
  const me = useMe();
  const saveLayout = useSaveLayout();
  const [customizing, setCustomizing] = useState(false);

  const layout = normalizeLayout(me.data?.dashboardLayout);
  const rangeQuery = analytics.data?.rangeQuery ?? (range.range === 'all' ? {} : { applied: range.range, ...(range.from ? { appliedFrom: range.from } : {}), ...(range.to ? { appliedTo: range.to } : {}) });
  const name = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const render = (id: string) => {
    switch (id) {
      case 'stats':
        return <StatCards cards={overview.data?.cards} rangeLabel={overview.data?.range.label} loading={overview.isLoading} followUpsDue={overview.data?.followUpsDueCount} />;
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

  return (
    <div className="space-y-5">
      {/* Top: greeting, search, quick add */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {greeting()}, {name}
          </h1>
          <p className="mt-0.5 text-sm text-muted">Here’s where your job search stands.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <GlobalSearch className="w-full sm:hidden" />
          <DateRangePicker value={range} info={overview.data?.range} onChange={(v) => update(rangeToQuery(v))} />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setCustomizing(true)}>
              <SlidersHorizontal className="h-3.5 w-3.5" /> Customize
            </Button>
            <LinkButton href="/wishlist/new" size="sm" className="hidden md:inline-flex lg:hidden">
              <Bookmark className="h-3.5 w-3.5" /> Wishlist
            </LinkButton>
            <LinkButton href="/applications/new" size="sm" variant="primary" className="hidden md:inline-flex lg:hidden">
              <Plus className="h-3.5 w-3.5" /> Application
            </LinkButton>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {layout
          .filter((s) => s.visible)
          .map((s) => {
            const def = DASHBOARD_SECTIONS.find((d) => d.id === s.id)!;
            return (
              <section key={s.id} className={cn('min-w-0', def.span === 'full' && 'lg:col-span-2')} aria-label={def.label}>
                {render(s.id)}
              </section>
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

export default function DashboardPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
