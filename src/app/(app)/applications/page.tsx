'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, Briefcase, ChevronLeft, ChevronRight, Columns3, Download, Filter, ListChecks, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from '@/lib/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ApplicationRowMenu, QuickLinks, StatusMenu } from '@/components/applications/actions';
import { DebouncedInput, FilterChips, FilterDrawer, PresetsMenu } from '@/components/applications/filter-ui';
import { OptionList } from '@/components/ui/multi-select';
import { MenuItem, MenuLabel, MenuSeparator, Popover } from '@/components/ui/overlay';
import { HScroll, TableScroll } from '@/components/ui/scroll';
import { Badge, Button, Card, Checkbox, cn, CompanyAvatar, EmptyState, LinkButton, PageHeader, Select, Skeleton } from '@/components/ui/ui';
import { download } from '@/lib/api';
import {
  appliedViaLabel,
  CONNECTION_LABEL,
  JOB_TYPE_LABEL,
  MESSAGE_LABEL,
  platformLabel,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  STATUS_OPTIONS,
  WORKPLACE_LABEL,
} from '@/lib/enums';
import { APPLICATION_FILTERS, countActive, DATE_PRESETS, DEFAULT_APP_PRESETS, useUrlFilters } from '@/lib/filters';
import { ago, daysLeft, fmtDateTime, fmtRelativeDay, fmtShort, locationText, money } from '@/lib/format';
import { useApplications, useBulkDelete, useBulkStatus, useFacets } from '@/lib/hooks';
import type { ApplicationRow } from '@/lib/types';

interface Column {
  key: string;
  label: string;
  sort?: string;
  render: (a: ApplicationRow) => React.ReactNode;
  className?: string;
}

const COLUMNS: Column[] = [
  { key: 'position', label: 'Position', sort: 'position', render: (a) => <span className="block max-w-[220px] truncate text-fg-2">{a.position}</span> },
  { key: 'status', label: 'Status', sort: 'status', render: (a) => <StatusMenu id={a.id} status={a.status} /> },
  { key: 'appliedAt', label: 'Applied', sort: 'appliedAt', render: (a) => <span className="whitespace-nowrap text-fg-2">{fmtShort(a.appliedAt)}</span> },
  { key: 'platform', label: 'Platform', sort: 'platform', render: (a) => <span className="text-fg-2">{platformLabel(a.platform)}</span> },
  { key: 'appliedVia', label: 'Applied via', render: (a) => <span className="text-fg-2">{appliedViaLabel(a.appliedVia)}</span> },
  { key: 'jobType', label: 'Job type', sort: 'jobType', render: (a) => <span className="text-fg-2">{JOB_TYPE_LABEL[a.jobType]}</span> },
  { key: 'workplace', label: 'Workplace', sort: 'workplace', render: (a) => <span className="text-fg-2">{WORKPLACE_LABEL[a.workplace]}</span> },
  { key: 'location', label: 'Location', render: (a) => <span className="block max-w-[160px] truncate text-fg-2">{locationText(a)}</span> },
  { key: 'salary', label: 'Salary', sort: 'salaryMax', render: (a) => <span className="whitespace-nowrap text-fg-2 tabular">{money(a.salaryMin, a.salaryMax, a.currency)}</span> },
  { key: 'priority', label: 'Priority', sort: 'priority', render: (a) => <Badge tone={PRIORITY_TONE[a.priority]}>{PRIORITY_LABEL[a.priority]}</Badge> },
  {
    key: 'deadline',
    label: 'Deadline',
    sort: 'deadline',
    render: (a) => {
      const n = daysLeft(a.deadline);
      return <span className={cn('whitespace-nowrap', n !== null && n < 0 ? 'text-critical' : 'text-fg-2')}>{a.deadline ? fmtRelativeDay(a.deadline) : '—'}</span>;
    },
  },
  {
    key: 'companyWebsite',
    label: 'Website',
    render: (a) =>
      a.companyWebsite ? (
        <a href={a.companyWebsite} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="block max-w-[160px] truncate text-accent hover:underline">
          {a.companyWebsite.replace(/^https?:\/\/(www\.)?/, '')}
        </a>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  { key: 'jobReference', label: 'Job ID', render: (a) => <span className="text-fg-2">{a.jobReference ?? '—'}</span> },
  { key: 'recruiter', label: 'Recruiter', render: (a) => <span className="block max-w-[140px] truncate text-fg-2">{a.recruiterName ?? '—'}</span> },
  { key: 'connection', label: 'Connection', render: (a) => <span className="text-fg-2">{CONNECTION_LABEL[a.connectionStatus]}</span> },
  {
    key: 'messages',
    label: 'MSG 1/2/3',
    render: (a) => (
      <span className="flex gap-1">
        {[a.msg1Status, a.msg2Status, a.msg3Status].map((s, i) => (
          <span
            key={i}
            title={`MSG-${i + 1}: ${MESSAGE_LABEL[s]}`}
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded text-[10px] font-semibold',
              s === 'REPLIED' ? 'bg-good-soft text-good' : s === 'SEEN' ? 'bg-violet-soft text-violet' : s === 'SENT' ? 'bg-info-soft text-info' : 'bg-surface-2 text-muted',
            )}
          >
            {i + 1}
          </span>
        ))}
        {a.needsReply && <Badge tone="serious">Reply</Badge>}
      </span>
    ),
  },
  {
    key: 'followUp',
    label: 'Next follow-up',
    render: (a) => {
      const f = a.followUps[0];
      if (!f) return <span className="text-muted">—</span>;
      const n = daysLeft(f.dueAt) ?? 0;
      return <span className={cn('whitespace-nowrap', n < 0 ? 'font-medium text-critical' : n === 0 ? 'font-medium text-serious' : 'text-fg-2')}>{n < 0 ? `${-n}d overdue` : fmtRelativeDay(f.dueAt)}</span>;
    },
  },
  {
    key: 'interview',
    label: 'Next interview',
    render: (a) => (a.interviews[0] ? <span className="whitespace-nowrap text-fg-2">{fmtDateTime(a.interviews[0].scheduledAt)}</span> : <span className="text-muted">—</span>),
  },
  { key: 'lastActivityAt', label: 'Last activity', sort: 'lastActivityAt', render: (a) => <span className="whitespace-nowrap text-fg-2">{ago(a.lastActivityAt)}</span> },
];

/** Row accent colour per status — a quick visual scan of the pipeline. */
const STATUS_COLOR: Record<ApplicationRow['status'], string> = {
  APPLIED: 'var(--info)',
  SCREENING: 'var(--violet)',
  IN_REVIEW: 'var(--violet)',
  ASSESSMENT: 'var(--warn)',
  INTERVIEW: 'var(--accent)',
  OFFER: 'var(--good)',
  ACCEPTED: 'var(--good)',
  REJECTED: 'var(--critical)',
  WITHDRAWN: 'var(--line-strong)',
  GHOSTED: 'var(--line-strong)',
};

const DEFAULT_COLS = ['position', 'status', 'appliedAt', 'platform', 'workplace', 'messages', 'followUp', 'lastActivityAt'];
const COLS_KEY = 'zp:app-cols';
const SORT_OPTIONS = [
  { value: 'appliedAt:desc', label: 'Newest applied' },
  { value: 'appliedAt:asc', label: 'Oldest applied' },
  { value: 'lastActivityAt:asc', label: 'Least recently active' },
  { value: 'lastActivityAt:desc', label: 'Recently active' },
  { value: 'company:asc', label: 'Company A–Z' },
  { value: 'deadline:asc', label: 'Deadline soonest' },
  { value: 'salaryMax:desc', label: 'Highest salary' },
  { value: 'priority:asc', label: 'Priority' },
];

function useColumns() {
  const [cols, setCols] = useState<string[]>(DEFAULT_COLS);
  useEffect(() => {
    try {
      const s = localStorage.getItem(COLS_KEY);
      if (s) setCols(JSON.parse(s));
    } catch {}
  }, []);
  const save = (next: string[]) => {
    const ordered = COLUMNS.map((c) => c.key).filter((k) => next.includes(k));
    setCols(ordered);
    try {
      localStorage.setItem(COLS_KEY, JSON.stringify(ordered));
    } catch {}
  };
  return [cols, save] as const;
}

function ApplicationsList() {
  const router = useRouter();
  const url = useUrlFilters('zp:apps-qs');
  const { data, isLoading, isFetching } = useApplications(url.qs);
  const { data: facets } = useFacets('applications');
  const [cols, setCols] = useColumns();
  const [drawer, setDrawer] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const bulkStatus = useBulkStatus();
  const bulkDelete = useBulkDelete();

  const visible = useMemo(() => COLUMNS.filter((c) => cols.includes(c.key)), [cols]);
  const sort = url.get('sort') || 'appliedAt';
  const dir = url.get('dir') || 'desc';
  const page = Number(url.get('page') || 1);
  const pageSize = Number(url.get('pageSize') || 25);
  const items = data?.items ?? [];
  const activeCount = countActive(APPLICATION_FILTERS, url.params);

  // Drop selections that are no longer on screen after filtering
  useEffect(() => {
    setSelected((s) => new Set([...s].filter((id) => items.some((i) => i.id === id))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const toggleSort = (key: string) => {
    if (sort === key) url.update({ sort: key, dir: dir === 'asc' ? 'desc' : 'asc' });
    else url.update({ sort: key, dir: key === 'company' || key === 'deadline' ? 'asc' : 'desc' });
  };

  const exportCsv = async (mode: 'all' | 'filtered' | 'selected') => {
    const q = new URLSearchParams(mode === 'all' ? '' : url.qs);
    q.delete('page');
    q.delete('pageSize');
    q.set('sort', sort);
    q.set('dir', dir);
    q.set('columns', ['company', ...cols].join(','));
    if (mode === 'selected') q.set('ids', [...selected].join(','));
    try {
      await download('/applications/export', q);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const allChecked = items.length > 0 && items.every((i) => selected.has(i.id));
  const someChecked = items.some((i) => selected.has(i.id));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Applications"
        icon={<Briefcase />}
        hue="indigo"
        description={
          data ? (
            <>
              <span className="font-semibold text-fg tabular">{data.total.toLocaleString()}</span> {activeCount ? 'applications match your filters' : 'applications tracked'}
            </>
          ) : (
            'Loading…'
          )
        }
        actions={
          <LinkButton href="/applications/new" variant="primary" size="sm" className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" /> Add application
          </LinkButton>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-2.5 shadow-card lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <DebouncedInput value={url.get('q')} onChange={(v) => url.update({ q: v })} placeholder="Search company, position, recruiter, notes…" className="pl-9" />
        </div>
        <span className="hidden h-6 w-px bg-line lg:block" />
        <HScroll className="min-w-0 flex-1" innerClassName="flex items-center gap-2 py-0.5">
          <Popover
            width={220}
            trigger={({ toggle }) => (
              <Button size="sm" variant={url.get('status') ? 'outline' : 'secondary'} onClick={toggle}>
                Status{url.getList('status').length ? ` · ${url.getList('status').length}` : ''}
              </Button>
            )}
          >
            <div className="p-1">
              <OptionList options={STATUS_OPTIONS} selected={url.getList('status')} onChange={(v) => url.update({ status: v })} />
            </div>
          </Popover>
          <Select
            size="sm"
            className="w-auto min-w-[130px]"
            value={url.get('applied')}
            onChange={(v) => (v === 'custom' ? setDrawer(true) : url.update({ applied: v, appliedFrom: null, appliedTo: null }))}
            placeholder="Any date"
            options={DATE_PRESETS}
            aria-label="Application date"
          />
          <Button size="sm" variant={activeCount > 0 ? 'outline' : 'secondary'} onClick={() => setDrawer(true)}>
            <Filter className="h-3.5 w-3.5" /> Filters
            {activeCount > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] text-white">{activeCount}</span>}
          </Button>
          <PresetsMenu scope="APPLICATIONS" defaults={DEFAULT_APP_PRESETS} url={url} />
          <Select
            size="sm"
            className="w-auto min-w-[150px] lg:hidden"
            value={`${sort}:${dir}`}
            onChange={(v) => {
              const [s, d] = v.split(':');
              url.update({ sort: s, dir: d });
            }}
            options={SORT_OPTIONS}
            aria-label="Sort"
          />
          <div className="hidden lg:block">
            <Popover
              align="end"
              width={230}
              trigger={({ toggle }) => (
                <Button size="sm" onClick={toggle}>
                  <Columns3 className="h-3.5 w-3.5" /> Columns
                </Button>
              )}
            >
              <div className="p-1">
                <p className="px-2 pt-1 pb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">Visible columns</p>
                <OptionList options={COLUMNS.map((c) => ({ value: c.key, label: c.label }))} selected={cols} onChange={setCols} maxHeight={320} />
                <button className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-muted hover:bg-surface-2" onClick={() => setCols(DEFAULT_COLS)}>
                  Reset to default
                </button>
              </div>
            </Popover>
          </div>
          <Popover
            align="end"
            width={240}
            trigger={({ toggle }) => (
              <Button size="sm" onClick={toggle}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            )}
          >
            <MenuLabel>Export CSV (visible columns)</MenuLabel>
            <MenuItem onSelect={() => exportCsv('filtered')}>Current filtered results ({data?.total ?? 0})</MenuItem>
            <MenuItem onSelect={() => exportCsv('selected')} disabled={!selected.size}>
              Selected applications ({selected.size})
            </MenuItem>
            <MenuSeparator />
            <MenuItem onSelect={() => exportCsv('all')}>All applications</MenuItem>
          </Popover>
        </HScroll>
      </div>

      <FilterChips defs={APPLICATION_FILTERS} url={url} facets={facets} total={data?.total} />

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-hero sticky top-[76px] z-10 flex flex-wrap items-center gap-2 rounded-2xl px-4 py-2.5 text-sm text-white shadow-pop">
          <ListChecks className="h-4 w-4 text-indigo-200" />
          <span className="font-semibold">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Popover
              width={190}
              trigger={({ toggle }) => (
                <Button size="sm" onClick={toggle}>
                  Change status
                </Button>
              )}
            >
              {STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} onSelect={() => bulkStatus.mutate({ ids: [...selected], status: o.value }, { onSuccess: () => setSelected(new Set()) })}>
                  {o.label}
                </MenuItem>
              ))}
            </Popover>
            <Button size="sm" onClick={() => exportCsv('selected')}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={bulkDelete.isPending}
              onClick={() => confirm(`Delete ${selected.size} applications? This cannot be undone.`) && bulkDelete.mutate([...selected], { onSuccess: () => setSelected(new Set()) })}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
            <Button size="sm" variant="ghost" className="text-indigo-100 hover:bg-white/10 hover:text-white" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <Card className={cn('overflow-hidden transition-opacity', isFetching && !isLoading && 'opacity-70')}>
        {isFetching && !isLoading && <div className="bg-brand absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse" />}
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Briefcase />}
            title={activeCount ? 'No applications match these filters' : 'No applications yet'}
            description={activeCount ? 'Try removing a filter or widening the date range.' : 'Track your first application to see it here.'}
            action={
              activeCount ? (
                <Button onClick={() => url.clear()}>Clear all filters</Button>
              ) : (
                <LinkButton href="/applications/new" variant="primary">
                  <Plus className="h-4 w-4" /> Add application
                </LinkButton>
              )
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <TableScroll className="hidden md:block">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-left text-[10.5px] font-bold tracking-[0.06em] text-muted uppercase">
                    <th className="sticky left-0 z-[1] w-10 bg-surface-2 px-3 py-3">
                      <Checkbox
                        checked={allChecked}
                        indeterminate={!allChecked && someChecked}
                        onChange={(v) => setSelected(v ? new Set(items.map((i) => i.id)) : new Set())}
                      />
                    </th>
                    <SortHeader label="Company" k="company" sort={sort} dir={dir} onSort={toggleSort} sticky />
                    {visible.map((c) =>
                      c.sort ? <SortHeader key={c.key} label={c.label} k={c.sort} sort={sort} dir={dir} onSort={toggleSort} /> : <th key={c.key} className="px-3 py-3 whitespace-nowrap">{c.label}</th>,
                    )}
                    <th className="w-20 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => router.push(`/applications/${a.id}`)}
                      className={cn('group cursor-pointer transition-colors', selected.has(a.id) ? 'bg-accent-soft/60' : 'hover:bg-surface-2/70')}
                    >
                      <td
                        className={cn('sticky left-0 z-[1] px-3 py-3', selected.has(a.id) ? 'bg-accent-soft' : 'bg-surface group-hover:bg-surface-2')}
                        style={{ boxShadow: `inset 3px 0 0 ${STATUS_COLOR[a.status]}` }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selected.has(a.id)}
                          onChange={(v) =>
                            setSelected((s) => {
                              const n = new Set(s);
                              if (v) n.add(a.id);
                              else n.delete(a.id);
                              return n;
                            })
                          }
                        />
                      </td>
                      <td className={cn('sticky left-10 z-[1] px-3 py-3 shadow-[1px_0_0_var(--line)]', selected.has(a.id) ? 'bg-accent-soft' : 'bg-surface group-hover:bg-surface-2')}>
                        <Link href={`/applications/${a.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2.5 font-semibold hover:text-accent">
                          <CompanyAvatar name={a.company} size="sm" />
                          <span className="max-w-[160px] truncate">{a.company}</span>
                        </Link>
                      </td>
                      {visible.map((c) => (
                        <td key={c.key} className="px-3 py-2.5" onClick={c.key === 'status' ? (e) => e.stopPropagation() : undefined}>
                          {c.render(a)}
                        </td>
                      ))}
                      <td className="px-2 py-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <QuickLinks jobUrl={a.jobUrl} />
                        <ApplicationRowMenu app={a} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>

            {/* Mobile: action-oriented cards */}
            <div className="divide-y divide-line md:hidden">
              {items.map((a) => {
                const f = a.followUps[0];
                const fn = f ? (daysLeft(f.dueAt) ?? 0) : null;
                return (
                  <div key={a.id} className="flex gap-3 px-4 py-3.5" style={{ boxShadow: `inset 3px 0 0 ${STATUS_COLOR[a.status]}` }} onClick={() => router.push(`/applications/${a.id}`)}>
                    <Checkbox
                      checked={selected.has(a.id)}
                      onChange={(v) =>
                        setSelected((s) => {
                          const n = new Set(s);
                          if (v) n.add(a.id);
                          else n.delete(a.id);
                          return n;
                        })
                      }
                      className="mt-2"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{a.company}</p>
                          <p className="truncate text-xs text-fg-2">{a.position}</p>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <ApplicationRowMenu app={a} />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <StatusMenu id={a.id} status={a.status} compact />
                        <Badge>{WORKPLACE_LABEL[a.workplace]}</Badge>
                        {f && <Badge tone={fn! < 0 ? 'critical' : fn === 0 ? 'serious' : 'neutral'}>Follow-up {fn! < 0 ? `${-fn!}d overdue` : fmtRelativeDay(f.dueAt)}</Badge>}
                        {a.needsReply && <Badge tone="serious">Reply needed</Badge>}
                        <span className="ml-auto text-[11px] text-muted">{fmtShort(a.appliedAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-xs text-muted">
            <span className="tabular">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.total)} of {data.total.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <Select
                size="sm"
                className="w-auto"
                value={String(pageSize)}
                onChange={(v) => url.update({ pageSize: v })}
                options={['10', '25', '50', '100'].map((v) => ({ value: v, label: `${v} / page` }))}
                aria-label="Rows per page"
              />
              <Button size="icon-sm" variant="ghost" disabled={page <= 1} onClick={() => url.update({ page: String(page - 1) })} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tabular">
                Page {page} of {data.pageCount}
              </span>
              <Button size="icon-sm" variant="ghost" disabled={page >= data.pageCount} onClick={() => url.update({ page: String(page + 1) })} aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <FilterDrawer open={drawer} onClose={() => setDrawer(false)} defs={APPLICATION_FILTERS} url={url} facets={facets} total={data?.total} fetching={isFetching} />
    </div>
  );
}

function SortHeader({ label, k, sort, dir, onSort, sticky }: { label: string; k: string; sort: string; dir: string; onSort: (k: string) => void; sticky?: boolean }) {
  const active = sort === k;
  return (
    <th className={cn('px-3 py-3 whitespace-nowrap', sticky && 'sticky left-10 z-[1] bg-surface-2 shadow-[1px_0_0_var(--line)]')} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => onSort(k)} className={cn('inline-flex items-center gap-1 uppercase hover:text-fg', active && 'text-accent')}>
        {label}
        {active ? dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </th>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense>
      <ApplicationsList />
    </Suspense>
  );
}
