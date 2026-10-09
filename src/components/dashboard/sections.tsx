'use client';

import { ArrowRight, BarChart3, Bookmark, Briefcase, CalendarClock, CalendarRange, ClipboardList, History, MessageSquareReply, PieChart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { INTERVIEW_TYPE_LABEL, PRIORITY_LABEL, PRIORITY_TONE, STATUS_LABEL, TASK_STATUS_LABEL, TASK_TYPE_LABEL } from '@/lib/enums';
import { daysLeft, daysLeftLabel, fmtDateTime, fmtRelativeDay, fmtShort } from '@/lib/format';
import { useActivity } from '@/lib/hooks';
import type { Analytics, DashboardOverview } from '@/lib/types';
import { ApplicationRowMenu, FollowUpDoneButton, MarkAppliedButton, RescheduleFollowUp, StatusMenu } from '../applications/actions';
import { BarList, VolumeChart } from '../charts/charts';
import { Badge, Card, CardHeader, cn, CompanyAvatar, EmptyState, Skeleton, SkeletonRows } from '../ui/ui';
import { ActivityFeed, ActivityTypeFilter } from './activity-feed';

function ViewAll({ href, label = 'View all' }: { href: string; label?: string }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
      {label} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

const qs = (q: Record<string, string>) => new URLSearchParams(q).toString();

function Table({ head, children, className }: { head: string[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-y border-line bg-surface-2/50 text-left text-[11px] font-medium tracking-wide text-muted uppercase">
            {head.map((h, i) => (
              <th key={h + i} className={cn('px-4 py-2 font-medium whitespace-nowrap', i === head.length - 1 && 'text-right')}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

/** Mobile-first list item that replaces wide table rows on small screens. */
function MobileItem({ href, company, title, sub, right }: { href: string; company: string; title: string; sub: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <CompanyAvatar name={company} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{title}</p>
          <p className="truncate text-[11px] text-muted">{sub}</p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-1">{right}</div>
    </div>
  );
}

// ── Upcoming agenda (next 14 days across deadlines, interviews, follow-ups, tasks) ──
export function UpcomingDeadlines({ data, loading }: { data?: DashboardOverview; loading?: boolean }) {
  type Item = { id: string; date: string; kind: string; tone: 'warn' | 'accent' | 'serious' | 'violet'; title: string; sub: string; href: string };
  const items: Item[] = [];
  if (data) {
    for (const w of data.wishlistDeadlines) items.push({ id: `w${w.id}`, date: w.deadline!, kind: 'Apply by', tone: 'warn', title: w.company, sub: w.position, href: `/wishlist/${w.id}` });
    for (const i of data.upcomingInterviews)
      items.push({ id: `i${i.id}`, date: i.scheduledAt, kind: 'Interview', tone: 'accent', title: i.application!.company, sub: INTERVIEW_TYPE_LABEL[i.type], href: `/applications/${i.applicationId}` });
    for (const f of data.followUps)
      items.push({ id: `f${f.id}`, date: f.dueAt, kind: 'Follow up', tone: 'serious', title: f.application!.company, sub: f.application!.recruiterName ?? f.application!.position, href: `/applications/${f.applicationId}` });
    for (const t of data.pendingTasks)
      if (t.dueAt) items.push({ id: `t${t.id}`, date: t.dueAt, kind: 'Task due', tone: 'violet', title: t.application!.company, sub: t.title, href: `/applications/${t.applicationId}` });
  }
  items.sort((a, b) => +new Date(a.date) - +new Date(b.date));

  return (
    <Card className="flex h-full flex-col">
      <CardHeader title="Upcoming deadlines" icon={<CalendarRange />} subtitle="Deadlines, interviews, follow-ups and tasks — soonest first" />
      <div className="flex-1 overflow-y-auto px-2 pb-3 lg:max-h-[460px]">
        {loading || !data ? (
          <SkeletonRows rows={5} />
        ) : items.length === 0 ? (
          <EmptyState compact icon={<CalendarRange />} title="Nothing scheduled" description="Add wishlist deadlines, interviews or follow-ups to see them here." />
        ) : (
          <ol className="space-y-0.5">
            {items.slice(0, 12).map((it) => {
              const n = daysLeft(it.date) ?? 0;
              return (
                <li key={it.id}>
                  <Link href={it.href} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2/70">
                    <div className={cn('flex w-12 shrink-0 flex-col items-center rounded-lg border py-1', n < 0 ? 'border-critical/30 bg-critical-soft' : 'border-line bg-surface-2/60')}>
                      <span className="text-[10px] font-medium text-muted uppercase">{fmtShort(it.date).split(' ')[0]}</span>
                      <span className="tabular text-sm leading-none font-semibold">{new Date(it.date).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{it.title}</p>
                      <p className="truncate text-[11px] text-muted">{it.sub}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={it.tone}>{it.kind}</Badge>
                      <span className={cn('text-[11px]', n < 0 ? 'font-medium text-critical' : 'text-muted')}>{n < 0 ? `${Math.abs(n)}d overdue` : fmtRelativeDay(it.date)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Card>
  );
}

// ── Charts ──
export function VolumeCard({ analytics, loading }: { analytics?: Analytics; loading?: boolean }) {
  return (
    <Card className="h-full">
      <CardHeader
        title="Application activity"
        icon={<BarChart3 />}
        subtitle={analytics ? `${analytics.total} applications · per ${analytics.granularity}` : undefined}
        action={<ViewAll href="/analytics" label="Analytics" />}
      />
      <div className="px-3 pb-4">
        {loading || !analytics ? (
          <Skeleton className="h-[240px] w-full" />
        ) : analytics.total === 0 ? (
          <EmptyState compact icon={<BarChart3 />} title="No applications in this range" description="Try a wider date range." />
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
    <Card className="h-full">
      <CardHeader title="Status distribution" icon={<PieChart />} subtitle={analytics?.range.label} />
      <div className="px-2 pb-4">
        {loading || !analytics ? (
          <SkeletonRows rows={5} />
        ) : analytics.statusDistribution.length === 0 ? (
          <EmptyState compact icon={<PieChart />} title="No data in this range" />
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
    <Card className="h-full overflow-hidden">
      <CardHeader title="Recent applications" icon={<Briefcase />} action={<ViewAll href={`/applications?${qs({ ...rangeQuery, sort: 'appliedAt', dir: 'desc' })}`} />} />
      {loading || !data ? (
        <SkeletonRows rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState compact icon={<Briefcase />} title="No applications yet" description="Add your first application to start tracking." />
      ) : (
        <>
          <Table head={['Company', 'Position', 'Status', 'Applied', '']} className="hidden md:block">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-surface-2/50">
                <td className="px-4 py-2.5">
                  <Link href={`/applications/${a.id}`} className="flex items-center gap-2.5 font-medium hover:text-accent">
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
              <MobileItem
                key={a.id}
                href={`/applications/${a.id}`}
                company={a.company}
                title={a.company}
                sub={`${a.position} · ${fmtShort(a.appliedAt)}`}
                right={<StatusMenu id={a.id} status={a.status} compact />}
              />
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
    <Card className="h-full overflow-hidden">
      <CardHeader title="Wishlist deadlines" icon={<Bookmark />} subtitle="Apply to these first" action={<ViewAll href="/wishlist?state=active&sort=deadline&dir=asc" />} />
      {loading || !data ? (
        <SkeletonRows rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState compact icon={<Bookmark />} title="No upcoming wishlist deadlines" description="Save jobs with deadlines to prioritise what to apply to next." />
      ) : (
        <>
          <Table head={['Company', 'Position', 'Days left', 'Priority', 'Apply']} className="hidden md:block [&_th:nth-child(2)]:hidden [&_td:nth-child(2)]:hidden 2xl:[&_th:nth-child(2)]:table-cell 2xl:[&_td:nth-child(2)]:table-cell">
            {rows.map((w) => {
              const n = daysLeft(w.deadline);
              return (
                <tr key={w.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-2.5">
                    <Link href={`/wishlist/${w.id}`} className="flex items-center gap-2.5 font-medium hover:text-accent">
                      <CompanyAvatar name={w.company} size="sm" />
                      <span className="max-w-[130px] truncate">{w.company}</span>
                    </Link>
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-2.5 text-fg-2">{w.position}</td>
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
    <Card className="h-full overflow-hidden">
      <CardHeader title="Recruiter follow-ups" icon={<MessageSquareReply />} action={<ViewAll href="/applications?followUp=pending" />} />
      {loading || !data ? (
        <SkeletonRows rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState compact icon={<MessageSquareReply />} title="No pending follow-ups" description="Schedule follow-ups from an application’s page." />
      ) : (
        <>
          <Table head={['Company', 'Position', 'Due', 'Mark done']} className="hidden md:block">
            {rows.map((f) => {
              const n = daysLeft(f.dueAt) ?? 0;
              return (
                <tr key={f.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-2.5">
                    <Link href={`/applications/${f.applicationId}`} className="flex items-center gap-2.5 font-medium hover:text-accent">
                      <CompanyAvatar name={f.application!.company} size="sm" />
                      <span className="max-w-[130px] truncate">{f.application!.company}</span>
                    </Link>
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-2.5 text-fg-2">{f.application!.position}</td>
                  <td className={cn('px-4 py-2.5 whitespace-nowrap', n < 0 ? 'font-medium text-critical' : n === 0 ? 'font-medium text-serious' : 'text-fg-2')}>
                    {n < 0 ? `${Math.abs(n)}d overdue` : fmtRelativeDay(f.dueAt)}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <RescheduleFollowUp id={f.id} />
                    <FollowUpDoneButton id={f.id} />
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
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader
        title={
          <span className="flex items-center gap-1">
            {(['interviews', 'tasks'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn('rounded-md px-2 py-0.5 text-sm font-semibold', tab === t ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg')}
              >
                {t === 'interviews' ? `Upcoming interviews (${interviews.length})` : `Tasks (${tasks.length})`}
              </button>
            ))}
          </span>
        }
        icon={tab === 'interviews' ? <CalendarClock /> : <ClipboardList />}
        action={<ViewAll href={tab === 'interviews' ? '/applications?interview=UPCOMING' : '/applications?task=PENDING'} />}
      />
      {loading || !data ? (
        <SkeletonRows rows={4} />
      ) : tab === 'interviews' ? (
        interviews.length === 0 ? (
          <EmptyState compact icon={<CalendarClock />} title="No upcoming interviews" description="Interviews you schedule on an application show up here." />
        ) : (
          <>
            <Table head={['Company', 'Interview type', 'Date', 'Details']} className="hidden md:block">
              {interviews.map((i) => (
                <tr key={i.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2.5 font-medium">
                      <CompanyAvatar name={i.application!.company} size="sm" />
                      <span className="max-w-[130px] truncate">{i.application!.company}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-fg-2">{INTERVIEW_TYPE_LABEL[i.type]}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-fg-2">{fmtDateTime(i.scheduledAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/applications/${i.applicationId}#interviews`} className="text-xs font-medium text-accent hover:underline">
                      Details
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
        <EmptyState compact icon={<ClipboardList />} title="No pending tasks" description="Coding assessments and take-homes appear here." />
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
  const { data, isLoading } = useActivity(qs({ pageSize: '12', ...(types.length ? { types: types.join(',') } : {}) }));
  return (
    <Card className="h-full">
      <CardHeader title="Recent activity" icon={<History />} action={<ViewAll href={`/activity${types.length ? `?types=${types.join(',')}` : ''}`} />} />
      <div className="px-4 pb-2">
        <ActivityTypeFilter value={types} onChange={setTypes} />
      </div>
      <div className="max-h-[420px] overflow-y-auto px-2 pb-3">
        <ActivityFeed items={data?.items} loading={isLoading} dense />
      </div>
    </Card>
  );
}
