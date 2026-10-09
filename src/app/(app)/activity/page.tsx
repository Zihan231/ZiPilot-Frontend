'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Suspense } from 'react';
import { ActivityFeed, ActivityTypeFilter } from '@/components/dashboard/activity-feed';
import { DateRangePicker } from '@/components/dashboard/date-range';
import { Button, Card } from '@/components/ui/ui';
import { useUrlFilters } from '@/lib/filters';
import { useActivity } from '@/lib/hooks';

function ActivityView() {
  const url = useUrlFilters();
  const range = url.get('range') || 'all';
  const page = Number(url.get('page') || 1);
  const qs = new URLSearchParams(url.qs);
  if (!qs.get('range')) qs.set('range', 'all');
  qs.set('pageSize', '40');
  const { data, isLoading, isFetching } = useActivity(qs.toString());
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted">Everything that changed in your job search, newest first.</p>
      </div>
      <div className="space-y-3">
        <DateRangePicker
          value={{ range, from: url.get('from') || undefined, to: url.get('to') || undefined }}
          onChange={(v) => url.update({ range: v.range, from: v.from ?? null, to: v.to ?? null })}
        />
        <ActivityTypeFilter value={url.getList('types')} onChange={(v) => url.update({ types: v })} />
      </div>
      <Card className={isFetching && !isLoading ? 'opacity-75' : ''}>
        <div className="px-2 py-3">
          <ActivityFeed items={data?.items} loading={isLoading} />
        </div>
        {data && data.total > data.pageSize && (
          <div className="flex items-center justify-between border-t border-line px-4 py-2 text-xs text-muted">
            <span className="tabular">{data.total.toLocaleString()} events</span>
            <div className="flex items-center gap-2">
              <Button size="icon-sm" variant="ghost" disabled={page <= 1} onClick={() => url.update({ page: String(page - 1) })} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tabular">
                Page {page} of {pageCount}
              </span>
              <Button size="icon-sm" variant="ghost" disabled={page >= pageCount} onClick={() => url.update({ page: String(page + 1) })} aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense>
      <ActivityView />
    </Suspense>
  );
}
