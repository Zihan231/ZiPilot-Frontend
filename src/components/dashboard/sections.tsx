'use client';

import { ArrowRight, BarChart3, Bookmark, Briefcase, CalendarClock, CalendarRange, ClipboardList, History, MessageSquareReply, PieChart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from '@/lib/navigation';
import { useState } from 'react';
import { INTERVIEW_TYPE_LABEL, PRIORITY_LABEL, PRIORITY_TONE, STATUS_LABEL, TASK_STATUS_LABEL, TASK_TYPE_LABEL } from '@/lib/enums';
import type { Hue } from '@/lib/enums';
import { daysLeft, daysLeftLabel, fmtDateTime, fmtRelativeDay, fmtShort } from '@/lib/format';
import { useActivity } from '@/lib/hooks';
import type { Analytics, DashboardOverview } from '@/lib/types';
import { ApplicationRowMenu, FollowUpDoneButton, MarkAppliedButton, RescheduleFollowUp, StatusMenu } from '../applications/actions';
import { BarList, VolumeChart } from '../charts/charts';
import { ScrollArea, TableScroll } from '../ui/scroll';
import { Badge, Card, CardHeader, cn, CompanyAvatar, EmptyState, HUE, Skeleton, SkeletonRows } from '../ui/ui';
import { ActivityFeed, ActivityTypeFilter } from './activity-feed';

function ViewAll({ href, label = 'View all' }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent-soft"
    >
      {label} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

const qs = (q: Record<string, string>) => new URLSearchParams(q).toString();

function Table({ head, children, className, align }: { head: string[]; children: React.ReactNode; className?: string; align?: ('left' | 'right')[] }) {
  return (
    <TableScroll className={className}>
      <table className="w-full min-w-[440px] text-[13px]">
        <thead>
          <tr className="border-y border-line bg-surface-2/70 text-left text-[10.5px] font-bold tracking-[0.06em] text-muted uppercase">
            {head.map((h, i) => (
              <th key={h + i} className={cn('px-4 py-2.5 whitespace-nowrap', (align?.[i] ?? (i === head.length - 1 ? 'right' : 'left')) === 'right' && 'text-right')}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </TableScroll>
  );
}

const rowCls = 'transition-colors hover:bg-surface-2/60';

/** Mobile-first list item that replaces wide table rows on small screens. */
function MobileItem({ href, company, title, sub, right }: { href: string; company: string; title: string; sub: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <CompanyAvatar name={company} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{title}</p>
          <p className="truncate text-[11.5px] text-muted">{sub}</p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-1">{right}</div>
    </div>
  );
}

// ── Upcoming agenda (deadlines, interviews, follow-ups, tasks) ──
const KIND: Record<string, { hue: Hue; label: string }> = {
  w: { hue: 'amber', label: 'Apply by' },
  i: { hue: 'indigo', label: 'Interview' },
  f: { hue: 'orange', label: 'Follow up' },
  t: { hue: 'teal', label: 'Task due' },
};

export function UpcomingDeadlines({ data, loading }: { data?: DashboardOverview; loading?: boolean }) {
  type Item = { id: string; date: string; kind: keyof typeof KIND; title: string; sub: string; href: string };
  const items: Item[] = [];
  if (data) {
    for (const w of data.wishlistDeadlines) items.push({ id: `w${w.id}`, date: w.deadline!, kind: 'w', title: w.company, sub: w.position, href: `/wishlist/${w.id}` });
    for (const i of data.upcomingInterviews) items.push({ id: `i${i.id}`, date: i.scheduledAt, kind: 'i', title: i.application!.company, sub: INTERVIEW_TYPE_LABEL[i.type], href: `/applications/${i.applicationId}` });
    for (const f of data.followUps)
      items.push({ id: `f${f.id}`, date: f.dueAt, kind: 'f', title: f.application!.company, sub: f.application!.recruiterName ?? f.application!.position, href: `/applications/${f.applicationId}` });
    for (const t of data.pendingTasks) if (t.dueAt) items.push({ id: `t${t.id}`, date: t.dueAt, kind: 't', title: t.application!.company, sub: t.title, href: `/applications/${t.applicationId}` });
  }
  items.sort((a, b) => +new Date(a.date) - +new Date(b.date));

  return (
    <Card hue="rose" className="flex h-full flex-col">
      <CardHeader
        hue="rose"
        title="Upcoming deadlines"
        icon={<CalendarRange />}
        count={items.length || undefined}
        subtitle="Deadlines, interviews, follow-ups & tasks — soonest first"
      />
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-5 pb-2">
        {Object.entries(KIND).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: HUE[v.hue].fg }} />
            {v.label}
          </span>
        ))}
      </div>
      <ScrollArea className="px-2 pb-3 lg:max-h-[470px]">
        {loading || !data ? (
          <SkeletonRows rows={5} />
        ) : items.length === 0 ? (
          <EmptyState compact hue="rose" icon={<CalendarRange />} title="Nothing scheduled" description="Add wishlist deadlines, interviews or follow-ups to see them here." />
        ) : (
          <ol className="space-y-1">
            {items.slice(0, 14).map((it) => {
              const n = daysLeft(it.date) ?? 0;
              const k = KIND[it.kind];
              const d = new Date(it.date);
              return (
                <li key={it.id}>
                  <Link href={it.href} className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-surface-2/70">
                    <div
                      className="flex w-12 shrink-0 flex-col items-center overflow-hidden rounded-xl border bg-surface shadow-card"
                      style={{ borderColor: n < 0 ? 'var(--critical)' : 'var(--line)' }}
                    >
                      <span className="w-full py-px text-center text-[9px] font-bold tracking-wider text-white uppercase" style={{ background: n < 0 ? 'var(--critical)' : HUE[k.hue].fg }}>
                        {d.toLocaleString('en', { month: 'short' })}
                      </span>
                      <span className="font-display tabular py-0.5 text-base leading-tight font-bold">{d.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{it.title}</p>
                      <p className="truncate text-[11.5px] text-muted">{it.sub}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: HUE[k.hue].soft, color: HUE[k.hue].fg }}>
                        {k.label}
                      </span>
                      <span className={cn('text-[11px]', n < 0 ? 'font-bold text-critical' : n === 0 ? 'font-semibold text-serious' : 'text-muted')}>
                        {n < 0 ? `${Math.abs(n)}d overdue` : fmtRelativeDay(it.date)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </ScrollArea>
    </Card>
  );
}

// ── Charts ──
export function VolumeCard({ analytics, loading }: { analytics?: Analytics; loading?: boolean }) {
  return (
    <Card hue="blue" className="h-full">
      <CardHeader
        hue="blue"
        title="Application activity"
        icon={<BarChart3 />}
        subtitle={analytics ? `${analytics.total} applications · grouped per ${analytics.granularity} · click a bar to drill in` : undefined}
        action={<ViewAll href="/analytics" label="Analytics" />}
      />
      <div className="px-3 pb-4">
        {loading || !analytics ? (
          <Skeleton className="h-[240px] w-full" />
        ) : analytics.total === 0 ? (
          <EmptyState compact hue="blue" icon={<BarChart3 />} title="No applications in this range" description="Try a wider date range." />
        ) : (
          <VolumeChart data={analytics.volume} granularity={analytics.granularity} baseQuery={analytics.rangeQuery} />
        )}
      </div>
    </Card>
  );
}

export function StatusCard({ analytics, loading }: { analytics?: Analytics; loading?: boolean }) {
  const router = useRouter();
  return (
    <Card hue="violet" className="h-full">
      <CardHeader hue="violet" title="Status distribution" icon={<PieChart />} subtitle={analytics ? `${analytics.range.label} · click a row to filter` : undefined} />
      <div className="px-3 pb-4">
        {loading || !analytics ? (
          <SkeletonRows rows={5} />
        ) : analytics.statusDistribution.length === 0 ? (
          <EmptyState compact hue="violet" icon={<PieChart />} title="No data in this range" />
        ) : (
          <BarList
            rows={analytics.statusDistribution.map((s) => ({
              key: s.status,
              label: STATUS_LABEL[s.status],
              value: s.count,
              hint: analytics.total ? `${Math.round((s.count / analytics.total) * 100)}%` : undefined,
            }))}
            onSelect={(status) => router.push(`/applications?${qs({ ...analytics.rangeQuery, status })}`)}
          />
        )}
      </div>
    </Card>
  );
}

// ── Quick review tables ──
export function RecentApplicationsTable({ data, loading, rangeQuery }: { data?: DashboardOverview; loading?: boolean; rangeQuery: Record<string, string> }) {
  const rows = data?.recentApplications ?? [];
  return (
    <Card hue="indigo" className="h-full overflow-hidden">
      <CardHeader hue="indigo" title="Recent applications" icon={<Briefcase />} action={<ViewAll href={`/applications?${qs({ ...rangeQuery, sort: 'appliedAt', dir: 'desc' })}`} />} />
      {loading || !data ? (
        <SkeletonRows rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState compact hue="indigo" icon={<Briefcase />} title="No applications yet" description="Add your first application to start tracking." />
      ) : (
        <>
          <Table head={['Company', 'Position', 'Status', 'Applied', '']} className="hidden md:block">
            {rows.map((a) => (
              <tr key={a.id} className={rowCls}>
                <td className="px-4 py-2.5">
                  <Link href={`/applications/${a.id}`} className="flex items-center gap-2.5 font-semibold hover:text-accent">
                    <CompanyAvatar name={a.company} size="sm" />
                    <span className="max-w-[140px] truncate">{a.company}</span>
                  </Link>
                </td>
                <td className="max-w-[180px] truncate px-4 py-2.5 text-fg-2">{a.position}</td>
                <td className="px-4 py-2.5">
                  <StatusMenu id={a.id} status={a.status} />
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-fg-2">{fmtShort(a.appliedAt)}</td>
                <td className="px-4 py-2.5 text-right">
                  <ApplicationRowMenu app={a} />
                </td>
              </tr>
            ))}
          </Table>
          <div className="divide-y divide-line border-t border-line md:hidden">
            {rows.map((a) => (
              <MobileItem key={a.id} href={`/applications/${a.id}`} company={a.company} title={a.company} sub={`${a.position} · ${fmtShort(a.appliedAt)}`} right={<StatusMenu id={a.id} status={a.status} compact />} />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export function WishlistQuickTable({ data, loading }: { data?: DashboardOverview; loading?: boolean }) {
  const rows = data?.wishlistDeadlines ?? [];
  return (
    <Card hue="amber" className="h-full overflow-hidden">
      <CardHeader hue="amber" title="Wishlist deadlines" icon={<Bookmark />} subtitle="Apply to these first" action={<ViewAll href="/wishlist?sort=deadline&dir=asc" />} />
      {loading || !data ? (
        <SkeletonRows rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState compact hue="amber" icon={<Bookmark />} title="No upcoming wishlist deadlines" description="Save jobs with deadlines to prioritise what to apply to next." />
      ) : (
        <>
          <Table head={['Company', 'Position', 'Days left', 'Priority', 'Apply']} className="hidden md:block [&_th:nth-child(2)]:hidden [&_td:nth-child(2)]:hidden 2xl:[&_th:nth-child(2)]:table-cell 2xl:[&_td:nth-child(2)]:table-cell">
            {rows.map((w) => {
              const n = daysLeft(w.deadline);
              return (
                <tr key={w.id} className={rowCls}>
                  <td className="px-4 py-2.5">
                    <Link href={`/wishlist/${w.id}`} className="flex items-center gap-2.5 font-semibold hover:text-accent">
                      <CompanyAvatar name={w.company} size="sm" />
                      <span className="max-w-[120px] truncate">{w.company}</span>
                    </Link>
                  </td>
                  <td className="max-w-[150px] truncate px-4 py-2.5 text-fg-2">{w.position}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <Badge tone={n !== null && n <= 1 ? 'serious' : n !== null && n <= 3 ? 'warn' : 'neutral'}>{daysLeftLabel(n)}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={PRIORITY_TONE[w.priority]}>{PRIORITY_LABEL[w.priority]}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <MarkAppliedButton id={w.id} label="Apply" />
                  </td>
                </tr>
              );
            })}
          </Table>
          <div className="divide-y divide-line border-t border-line md:hidden">
            {rows.map((w) => (
              <MobileItem key={w.id} href={`/wishlist/${w.id}`} company={w.company} title={w.company} sub={`${w.position} · ${daysLeftLabel(daysLeft(w.deadline))}`} right={<MarkAppliedButton id={w.id} label="Apply" />} />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export function FollowUpsTable({ data, loading }: { data?: DashboardOverview; loading?: boolean }) {
  const rows = data?.followUps ?? [];
  return (
    <Card hue="teal" className="h-full overflow-hidden">
      <CardHeader hue="teal" title="Recruiter follow-ups" icon={<MessageSquareReply />} action={<ViewAll href="/applications?followUp=pending" />} />
      {loading || !data ? (
        <SkeletonRows rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState compact hue="teal" icon={<MessageSquareReply />} title="No pending follow-ups" description="Schedule follow-ups from an application’s page." />
      ) : (
        <>
          <Table head={['Company', 'Position', 'Due', 'Actions']} className="hidden md:block [&_th:nth-child(2)]:hidden [&_td:nth-child(2)]:hidden 2xl:[&_th:nth-child(2)]:table-cell 2xl:[&_td:nth-child(2)]:table-cell">
            {rows.map((f) => {
              const n = daysLeft(f.dueAt) ?? 0;
              return (
                <tr key={f.id} className={rowCls}>
                  <td className="px-4 py-2.5">
                    <Link href={`/applications/${f.applicationId}`} className="flex items-center gap-2.5 font-semibold hover:text-accent">
                      <CompanyAvatar name={f.application!.company} size="sm" />
                      <span className="max-w-[130px] truncate">{f.application!.company}</span>
                    </Link>
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-2.5 text-fg-2">{f.application!.position}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {n < 0 ? <Badge tone="critical">{Math.abs(n)}d overdue</Badge> : n === 0 ? <Badge tone="serious">Today</Badge> : <span className="text-fg-2">{fmtRelativeDay(f.dueAt)}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <span className="inline-flex gap-1.5">
                      <RescheduleFollowUp id={f.id} />
                      <FollowUpDoneButton id={f.id} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </Table>
          <div className="divide-y divide-line border-t border-line md:hidden">
            {rows.map((f) => (
              <MobileItem
                key={f.id}
                href={`/applications/${f.applicationId}`}
                company={f.application!.company}
                title={f.application!.company}
                sub={`${f.application!.position} · ${fmtRelativeDay(f.dueAt)}`}
                right={
                  <>
                    <RescheduleFollowUp id={f.id} />
                    <FollowUpDoneButton id={f.id} />
                  </>
                }
              />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export function InterviewsTasksTable({ data, loading }: { data?: DashboardOverview; loading?: boolean }) {
  const [tab, setTab] = useState<'interviews' | 'tasks'>('interviews');
  const interviews = data?.upcomingInterviews ?? [];
  const tasks = data?.pendingTasks ?? [];
  const hue: Hue = tab === 'interviews' ? 'indigo' : 'teal';
  return (
    <Card hue={hue} className="h-full overflow-hidden">
      <CardHeader
        hue={hue}
        title={tab === 'interviews' ? 'Upcoming interviews' : 'Assessments & tasks'}
        icon={tab === 'interviews' ? <CalendarClock /> : <ClipboardList />}
        action={<ViewAll href={tab === 'interviews' ? '/applications?interview=UPCOMING' : '/applications?task=PENDING'} />}
      />
      <div className="px-5 pb-3">
        <div className="inline-flex rounded-lg bg-surface-2 p-0.5 ring-1 ring-line ring-inset" role="tablist">
          {(['interviews', 'tasks'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn('rounded-md px-3 py-1 text-xs font-semibold transition-all', tab === t ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg')}
            >
              {t === 'interviews' ? 'Interviews' : 'Tasks'}
              <span className="tabular ml-1.5 rounded-full bg-surface-3 px-1.5 text-[10px]">{t === 'interviews' ? interviews.length : tasks.length}</span>
            </button>
          ))}
        </div>
      </div>
      {loading || !data ? (
        <SkeletonRows rows={4} />
      ) : tab === 'interviews' ? (
        interviews.length === 0 ? (
          <EmptyState compact hue="indigo" icon={<CalendarClock />} title="No upcoming interviews" description="Interviews you schedule on an application show up here." />
        ) : (
          <>
            <Table head={['Company', 'Interview type', 'Date', 'Details']} className="hidden md:block">
              {interviews.map((i) => (
                <tr key={i.id} className={rowCls}>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2.5 font-semibold">
                      <CompanyAvatar name={i.application!.company} size="sm" />
                      <span className="max-w-[130px] truncate">{i.application!.company}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone="accent">{INTERVIEW_TYPE_LABEL[i.type]}</Badge>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-fg-2">{fmtDateTime(i.scheduledAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/applications/${i.applicationId}#interviews`} className="text-xs font-semibold text-accent hover:underline">
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </Table>
            <div className="divide-y divide-line border-t border-line md:hidden">
              {interviews.map((i) => (
                <MobileItem
                  key={i.id}
                  href={`/applications/${i.applicationId}#interviews`}
                  company={i.application!.company}
                  title={`${i.application!.company} · ${INTERVIEW_TYPE_LABEL[i.type]}`}
                  sub={fmtDateTime(i.scheduledAt)}
                  right={<Badge tone="accent">{fmtRelativeDay(i.scheduledAt)}</Badge>}
                />
              ))}
            </div>
          </>
        )
      ) : tasks.length === 0 ? (
        <EmptyState compact hue="teal" icon={<ClipboardList />} title="No pending tasks" description="Coding assessments and take-homes appear here." />
      ) : (
        <div className="divide-y divide-line border-t border-line">
          {tasks.map((t) => (
            <MobileItem
              key={t.id}
              href={`/applications/${t.applicationId}#tasks`}
              company={t.application!.company}
              title={`${t.title} · ${t.application!.company}`}
              sub={`${TASK_TYPE_LABEL[t.type]} · ${TASK_STATUS_LABEL[t.status]}`}
              right={t.dueAt ? <Badge tone={(daysLeft(t.dueAt) ?? 0) < 0 ? 'critical' : 'warn'}>{fmtRelativeDay(t.dueAt)}</Badge> : undefined}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

export function RecentActivityCard() {
  const [types, setTypes] = useState<string[]>([]);
  const { data, isLoading } = useActivity(qs({ pageSize: '15', ...(types.length ? { types: types.join(',') } : {}) }));
  return (
    <Card hue="slate" className="h-full">
      <CardHeader hue="slate" title="Recent activity" icon={<History />} subtitle="Everything that changed, newest first" action={<ViewAll href={`/activity${types.length ? `?types=${types.join(',')}` : ''}`} />} />
      <div className="px-5 pb-3">
        <ActivityTypeFilter value={types} onChange={setTypes} />
      </div>
      <ScrollArea className="max-h-[440px] px-3 pb-3">
        <ActivityFeed items={data?.items} loading={isLoading} dense />
      </ScrollArea>
    </Card>
  );
}
