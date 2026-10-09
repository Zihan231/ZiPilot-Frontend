'use client';

import { Bell, BellOff, Bookmark, ChevronLeft, ChevronRight, Download, ExternalLink, Filter, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from '@/lib/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { MarkAppliedButton, StatusBadge } from '@/components/applications/actions';
import { EmailRemindersCard } from '@/components/wishlist/email-reminders-card';
import { DebouncedInput, FilterChips, FilterDrawer, PresetsMenu } from '@/components/applications/filter-ui';
import { MenuItem, MenuLabel, MenuSeparator, Popover } from '@/components/ui/overlay';
import { HScroll } from '@/components/ui/scroll';
import { Badge, Button, Card, CardHeader, cn, CompanyAvatar, EmptyState, LinkButton, PageHeader, Select, SkeletonRows } from '@/components/ui/ui';
import { AlarmClock, TimerOff } from 'lucide-react';
import { download } from '@/lib/api';
import { JOB_TYPE_LABEL, platformLabel, PRIORITY_LABEL, PRIORITY_TONE, WORKPLACE_LABEL } from '@/lib/enums';
import { countActive, DEFAULT_WISHLIST_PRESETS, useUrlFilters, WISHLIST_FILTERS } from '@/lib/filters';
import { daysLeft, daysLeftLabel, fmtShort, locationText, money } from '@/lib/format';
import { useDeleteWishlist, useFacets, useUpdateWishlist, useWishlist } from '@/lib/hooks';
import type { Paged, WishlistJob } from '@/lib/types';

const STATES = [
  { value: '', label: 'To apply' },
  { value: 'applied', label: 'Applied' },
  { value: 'all', label: 'All' },
];

const SORTS = [
  { value: 'deadline:asc', label: 'Nearest deadline' },
  { value: 'priority:asc', label: 'Priority' },
  { value: 'createdAt:desc', label: 'Recently saved' },
  { value: 'company:asc', label: 'Company A–Z' },
  { value: 'salaryMax:desc', label: 'Highest salary' },
];

function urgencyTone(n: number | null) {
  if (n === null) return 'neutral' as const;
  if (n < 0) return 'critical' as const;
  if (n <= 1) return 'serious' as const;
  if (n <= 3) return 'warn' as const;
  return 'neutral' as const;
}

const STRIPE: Record<string, string> = { critical: 'var(--critical)', serious: 'var(--serious)', warn: 'var(--c-amber)', neutral: 'var(--line-strong)' };

function JobRow({ job }: { job: WishlistJob }) {
  const router = useRouter();
  const update = useUpdateWishlist();
  const del = useDeleteWishlist();
  const n = daysLeft(job.deadline);
  return (
    <div
      className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-surface-2/60 md:flex-row md:items-center md:gap-4"
      style={{ boxShadow: `inset 3px 0 0 ${job.appliedAt ? 'var(--good)' : STRIPE[urgencyTone(n)]}` }}
    >
      <Link href={`/wishlist/${job.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <CompanyAvatar name={job.company} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {job.company} <span className="font-normal text-fg-2">· {job.position}</span>
          </p>
          <p className="truncate text-xs text-muted">
            {[WORKPLACE_LABEL[job.workplace], JOB_TYPE_LABEL[job.jobType], platformLabel(job.platform), locationText(job) !== '—' ? locationText(job) : null, money(job.salaryMin, job.salaryMax, job.currency) !== '—' ? money(job.salaryMin, job.salaryMax, job.currency) : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-2 pl-12 md:pl-0">
        {job.appliedAt ? (
          <>
            <span className="text-xs text-muted">Applied {fmtShort(job.appliedAt)}</span>
            {job.application && (
              <Link href={`/applications/${job.application.id}`}>
                <StatusBadge status={job.application.status} />
              </Link>
            )}
          </>
        ) : (
          <>
            <Badge tone={urgencyTone(n)}>{daysLeftLabel(n)}</Badge>
            <Badge tone={PRIORITY_TONE[job.priority]}>{PRIORITY_LABEL[job.priority]}</Badge>
            <button
              onClick={() => update.mutate({ id: job.id, reminderSent: !job.reminderSent })}
              className={cn('rounded-md p-1.5 hover:bg-surface-2', job.reminderSent ? 'text-good' : 'text-muted')}
              title={job.reminderSent ? 'Reminder sent — click to mark pending' : 'Reminder pending — click to mark sent'}
            >
              {job.reminderSent ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            </button>
            <MarkAppliedButton id={job.id} />
          </>
        )}
        <Popover
          align="end"
          width={200}
          trigger={({ toggle }) => (
            <Button size="icon-sm" variant="ghost" onClick={toggle} aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        >
          <MenuItem icon={<ExternalLink />} href={job.jobUrl ?? undefined} external disabled={!job.jobUrl}>
            Open job link
          </MenuItem>
          <MenuItem icon={<Pencil />} onSelect={() => router.push(`/wishlist/${job.id}`)}>
            Edit
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 />} danger onSelect={() => confirm(`Remove ${job.company} from your wishlist?`) && del.mutate(job.id)}>
            Remove
          </MenuItem>
        </Popover>
      </div>
    </div>
  );
}

function Pager({ data, page, onPage }: { data: Paged<WishlistJob>; page: number; onPage: (p: number) => void }) {
  if (data.pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-2 text-xs text-muted">
      <Button size="icon-sm" variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="tabular">
        Page {page} of {data.pageCount}
      </span>
      <Button size="icon-sm" variant="ghost" disabled={page >= data.pageCount} onClick={() => onPage(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function WishlistList() {
  const url = useUrlFilters('zp:wishlist-qs');
  const { data: facets } = useFacets('wishlist');
  const [drawer, setDrawer] = useState(false);
  const [expiredPage, setExpiredPage] = useState(1);
  const state = url.get('state');
  const split = !state; // default view: active list + separate expired section
  const sort = url.get('sort') || 'deadline';
  const dir = url.get('dir') || (sort === 'deadline' || sort === 'company' || sort === 'priority' ? 'asc' : 'desc');
  const page = Number(url.get('page') || 1);

  const mainQs = (() => {
    const p = new URLSearchParams(url.qs);
    p.set('state', split ? 'active' : state);
    return p.toString();
  })();
  const expiredQs = (() => {
    const p = new URLSearchParams(url.qs);
    p.set('state', 'expired');
    p.delete('sort');
    p.delete('dir');
    p.set('page', String(expiredPage));
    p.set('pageSize', '10');
    return p.toString();
  })();

  const main = useWishlist(mainQs);
  const expired = useWishlist(expiredQs, { enabled: split });
  const activeCount = countActive(WISHLIST_FILTERS, url.params);

  const exportCsv = async (filtered: boolean) => {
    const q = filtered ? new URLSearchParams(url.qs) : new URLSearchParams();
    q.set('state', filtered ? (state || 'open') : 'all');
    q.delete('page');
    q.delete('pageSize');
    try {
      await download('/wishlist/export', q);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Wishlist"
        icon={<Bookmark />}
        hue="amber"
        description="Jobs you plan to apply to — nearest deadline first."
        actions={
          <LinkButton href="/wishlist/new" variant="primary" size="sm" className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" /> Add job
          </LinkButton>
        }
      />

      <EmailRemindersCard />

      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-2.5 shadow-card lg:flex-row lg:items-center">
        <div className="flex rounded-xl bg-surface-2 p-1 ring-1 ring-line ring-inset">
          {STATES.map((s) => (
            <button
              key={s.value}
              onClick={() => url.update({ state: s.value || null })}
              className={cn('flex-1 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all lg:flex-none', state === s.value ? 'bg-surface text-accent shadow-card ring-1 ring-line' : 'text-fg-2 hover:text-fg')}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <DebouncedInput value={url.get('q')} onChange={(v) => url.update({ q: v })} placeholder="Search wishlist…" className="pl-9" />
        </div>
        <HScroll className="min-w-0 flex-1" innerClassName="flex items-center gap-2 py-0.5">
          <Button size="sm" variant={activeCount > 0 ? 'outline' : 'secondary'} onClick={() => setDrawer(true)}>
            <Filter className="h-3.5 w-3.5" /> Filters
            {activeCount > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] text-white">{activeCount}</span>}
          </Button>
          <PresetsMenu scope="WISHLIST" defaults={DEFAULT_WISHLIST_PRESETS} url={url} />
          <Select
            size="sm"
            className="w-auto min-w-[150px]"
            value={`${sort}:${dir}`}
            onChange={(v) => {
              const [s, d] = v.split(':');
              url.update({ sort: s, dir: d });
            }}
            options={SORTS}
            aria-label="Sort"
          />
          <Popover
            align="end"
            width={220}
            trigger={({ toggle }) => (
              <Button size="sm" onClick={toggle}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            )}
          >
            <MenuLabel>Export CSV</MenuLabel>
            <MenuItem onSelect={() => exportCsv(true)}>Filtered wishlist</MenuItem>
            <MenuItem onSelect={() => exportCsv(false)}>Entire wishlist</MenuItem>
          </Popover>
        </HScroll>
      </div>

      <FilterChips defs={WISHLIST_FILTERS} url={url} facets={facets} total={main.data ? main.data.total + (split ? (expired.data?.total ?? 0) : 0) : undefined} />

      <Card hue="amber" className="overflow-hidden">
        <CardHeader
          hue="amber"
          title={split ? 'Active — apply before the deadline' : STATES.find((s) => s.value === state)?.label}
          icon={<AlarmClock />}
          count={main.data?.total}
          subtitle={split ? 'Colour stripe shows urgency: red overdue · orange ≤1 day · amber ≤3 days' : undefined}
        />
        {main.isLoading ? (
          <SkeletonRows rows={6} />
        ) : !main.data?.items.length ? (
          <EmptyState
            icon={<Bookmark />}
            hue="amber"
            title={activeCount ? 'No wishlist jobs match these filters' : 'Your wishlist is empty'}
            description={activeCount ? 'Try clearing a filter.' : 'Save jobs you want to apply to — ZiPilot will keep their deadlines in front of you.'}
            action={
              activeCount ? (
                <Button onClick={() => url.clear()}>Clear all filters</Button>
              ) : (
                <LinkButton href="/wishlist/new" variant="primary">
                  <Plus className="h-4 w-4" /> Add job
                </LinkButton>
              )
            }
          />
        ) : (
          <div className={cn('divide-y divide-line border-t border-line', main.isFetching && 'opacity-70')}>
            {main.data.items.map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </div>
        )}
        {main.data && <Pager data={main.data} page={page} onPage={(p) => url.update({ page: String(p) })} />}
      </Card>

      {split && (expired.data?.total ?? 0) > 0 && (
        <Card hue="rose" className="overflow-hidden">
          <CardHeader hue="rose" title="Expired" icon={<TimerOff />} count={expired.data!.total} subtitle="Deadline passed — apply anyway or remove" />
          <div className="divide-y divide-line border-t border-line opacity-90">
            {expired.data!.items.map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </div>
          <Pager data={expired.data!} page={expiredPage} onPage={setExpiredPage} />
        </Card>
      )}

      <FilterDrawer open={drawer} onClose={() => setDrawer(false)} defs={WISHLIST_FILTERS} url={url} facets={facets} total={main.data?.total} fetching={main.isFetching} />
    </div>
  );
}

export default function WishlistPage() {
  return (
    <Suspense>
      <WishlistList />
    </Suspense>
  );
}
