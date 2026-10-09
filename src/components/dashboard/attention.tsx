'use client';

import { AlarmClock, CalendarClock, CheckCircle2, ClipboardList, ExternalLink, Hourglass, MessageSquareReply, Reply, Send, Sparkles, TimerOff } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { INTERVIEW_TYPE_LABEL, TASK_TYPE_LABEL } from '@/lib/enums';
import { ago, daysLeft, fmtDateTime, fmtRelativeDay } from '@/lib/format';
import { useAttention, useUpdateTask } from '@/lib/hooks';
import type { AppRef, Attention, FollowUp, Interview, Task, WishlistJob } from '@/lib/types';
import { FollowUpDoneButton, MarkAppliedButton, MarkRepliedButton, QuickLinks, RescheduleFollowUp, StatusMenu } from '../applications/actions';
import { Badge, Button, Card, cn, CompanyAvatar, EmptyState, SkeletonRows } from '../ui/ui';

type Key = keyof Omit<Attention, 'total'>;

const SECTIONS: { key: Key; label: string; icon: React.ElementType; viewAll: string }[] = [
  { key: 'wishlistOverdue', label: 'Overdue deadlines', icon: TimerOff, viewAll: '/wishlist?state=expired' },
  { key: 'wishlistDueSoon', label: 'Deadlines in 3 days', icon: AlarmClock, viewAll: '/wishlist?deadline=3d' },
  { key: 'followUpsDue', label: 'Follow-ups due', icon: MessageSquareReply, viewAll: '/applications?followUp=overdue,today' },
  { key: 'upcomingInterviews', label: 'Upcoming interviews', icon: CalendarClock, viewAll: '/applications?interview=UPCOMING' },
  { key: 'pendingTasks', label: 'Pending assessments', icon: ClipboardList, viewAll: '/applications?task=PENDING' },
  { key: 'needsReply', label: 'Recruiters awaiting reply', icon: Reply, viewAll: '/applications?needsReply=yes' },
  { key: 'staleApplications', label: 'No updates 7+ days', icon: Hourglass, viewAll: '/applications?activeOnly=yes&inactive=7&sort=lastActivityAt&dir=asc' },
];

function Row({ href, company, title, meta, badge, actions }: { href: string; company: string; title: React.ReactNode; meta?: React.ReactNode; badge?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="group flex flex-col gap-2 rounded-lg px-2 py-2 hover:bg-surface-2/70 sm:flex-row sm:items-center sm:gap-3">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <CompanyAvatar name={company} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{title}</p>
          {meta && <p className="truncate text-[11px] text-muted">{meta}</p>}
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-1.5 pl-10 sm:pl-0">
        {badge}
        {actions}
      </div>
    </div>
  );
}

function WishlistRow({ job, overdue }: { job: WishlistJob; overdue?: boolean }) {
  const n = daysLeft(job.deadline) ?? 0;
  return (
    <Row
      href={`/wishlist/${job.id}`}
      company={job.company}
      title={
        <>
          {job.company} <span className="font-normal text-fg-2">· {job.position}</span>
        </>
      }
      badge={
        <Badge tone={overdue ? 'critical' : n === 0 ? 'serious' : 'warn'}>
          {overdue ? `${Math.abs(n)}d overdue` : n === 0 ? 'Due today' : n === 1 ? 'Tomorrow' : `${n} days left`}
        </Badge>
      }
      actions={
        <>
          <QuickLinks jobUrl={job.jobUrl} />
          <MarkAppliedButton id={job.id} />
        </>
      }
    />
  );
}

function FollowUpRow({ f }: { f: FollowUp }) {
  const n = daysLeft(f.dueAt) ?? 0;
  const a = f.application!;
  return (
    <Row
      href={`/applications/${a.id}`}
      company={a.company}
      title={
        <>
          {a.recruiterName ? `${a.recruiterName} · ` : ''}
          {a.company}
        </>
      }
      meta={`${a.position}${f.note ? ` — ${f.note}` : ''}`}
      badge={<Badge tone={n < 0 ? 'critical' : 'serious'}>{n < 0 ? `${Math.abs(n)}d overdue` : 'Due today'}</Badge>}
      actions={
        <>
          <QuickLinks linkedin={a.recruiterLinkedin} />
          <RescheduleFollowUp id={f.id} />
          <FollowUpDoneButton id={f.id} />
        </>
      }
    />
  );
}

function InterviewRow({ i }: { i: Interview }) {
  const a = i.application!;
  return (
    <Row
      href={`/applications/${a.id}`}
      company={a.company}
      title={
        <>
          {a.company} <span className="font-normal text-fg-2">· {INTERVIEW_TYPE_LABEL[i.type]}</span>
        </>
      }
      meta={`${fmtDateTime(i.scheduledAt)}${i.location ? ` · ${i.location}` : ''}`}
      badge={<Badge tone="accent">{fmtRelativeDay(i.scheduledAt)}</Badge>}
      actions={
        i.location?.startsWith('http') ? (
          <a href={i.location} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg" title="Join meeting">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null
      }
    />
  );
}

function TaskRow({ t }: { t: Task }) {
  const update = useUpdateTask();
  const a = t.application!;
  const n = daysLeft(t.dueAt);
  return (
    <Row
      href={`/applications/${a.id}`}
      company={a.company}
      title={
        <>
          {t.title} <span className="font-normal text-fg-2">· {a.company}</span>
        </>
      }
      meta={TASK_TYPE_LABEL[t.type]}
      badge={n !== null ? <Badge tone={n < 0 ? 'critical' : n <= 1 ? 'serious' : 'warn'}>{n < 0 ? `${Math.abs(n)}d overdue` : fmtRelativeDay(t.dueAt)}</Badge> : undefined}
      actions={
        <>
          <QuickLinks jobUrl={t.link} />
          <Button size="xs" variant="soft" onClick={() => update.mutate({ id: t.id, status: 'SUBMITTED' })} loading={update.isPending}>
            <Send className="h-3.5 w-3.5" /> Submitted
          </Button>
        </>
      }
    />
  );
}

function StaleRow({ a }: { a: AppRef }) {
  return (
    <Row
      href={`/applications/${a.id}`}
      company={a.company}
      title={
        <>
          {a.company} <span className="font-normal text-fg-2">· {a.position}</span>
        </>
      }
      meta={`Last update ${ago(a.lastActivityAt)}`}
      actions={
        <>
          <QuickLinks jobUrl={a.jobUrl} linkedin={a.recruiterLinkedin} />
          <StatusMenu id={a.id} status={a.status} />
        </>
      }
    />
  );
}

function ReplyRow({ a }: { a: AppRef }) {
  return (
    <Row
      href={`/applications/${a.id}`}
      company={a.company}
      title={
        <>
          {a.recruiterName ?? 'Recruiter'} <span className="font-normal text-fg-2">· {a.company}</span>
        </>
      }
      meta={`Replied ${ago(a.recruiterRepliedAt)} · ${a.position}`}
      actions={
        <>
          <QuickLinks linkedin={a.recruiterLinkedin} />
          <MarkRepliedButton id={a.id} />
        </>
      }
    />
  );
}

function renderItems(key: Key, data: Attention, limit?: number) {
  const slice = <T,>(arr: T[]) => (limit ? arr.slice(0, limit) : arr);
  switch (key) {
    case 'wishlistOverdue':
      return slice(data.wishlistOverdue.items).map((j) => <WishlistRow key={j.id} job={j} overdue />);
    case 'wishlistDueSoon':
      return slice(data.wishlistDueSoon.items).map((j) => <WishlistRow key={j.id} job={j} />);
    case 'followUpsDue':
      return slice(data.followUpsDue.items).map((f) => <FollowUpRow key={f.id} f={f} />);
    case 'upcomingInterviews':
      return slice(data.upcomingInterviews.items).map((i) => <InterviewRow key={i.id} i={i} />);
    case 'pendingTasks':
      return slice(data.pendingTasks.items).map((t) => <TaskRow key={t.id} t={t} />);
    case 'staleApplications':
      return slice(data.staleApplications.items).map((a) => <StaleRow key={a.id} a={a} />);
    case 'needsReply':
      return slice(data.needsReply.items).map((a) => <ReplyRow key={a.id} a={a} />);
  }
}

/** "Needs My Attention" — always current; independent of the analytics date filter. */
export function AttentionCenter() {
  const { data, isLoading } = useAttention();
  const [tab, setTab] = useState<Key | 'all'>('all');

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Needs my attention</h2>
            <p className="text-[11px] text-muted">{data ? (data.total ? `${data.total} items need action` : 'You are all caught up') : 'Loading…'}</p>
          </div>
        </div>
      </div>

      {data && data.total > 0 && (
        <div className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-2">
          <TabButton active={tab === 'all'} onClick={() => setTab('all')} label="All" count={data.total} />
          {SECTIONS.filter((s) => data[s.key].total > 0).map((s) => (
            <TabButton key={s.key} active={tab === s.key} onClick={() => setTab(s.key)} label={s.label} count={data[s.key].total} />
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 pb-3 lg:max-h-[460px]">
        {isLoading || !data ? (
          <SkeletonRows rows={5} />
        ) : data.total === 0 ? (
          <EmptyState icon={<CheckCircle2 />} title="Nothing needs your attention" description="No overdue deadlines, follow-ups, interviews, tasks or recruiter replies right now." />
        ) : tab === 'all' ? (
          SECTIONS.filter((s) => data[s.key].total > 0).map((s) => (
            <section key={s.key} className="mt-1">
              <div className="flex items-center justify-between px-2 pt-2 pb-1">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                  <s.icon className="h-3.5 w-3.5" /> {s.label}
                  <span className="tabular">· {data[s.key].total}</span>
                </p>
                {data[s.key].total > 3 && (
                  <button onClick={() => setTab(s.key)} className="text-[11px] font-medium text-accent hover:underline">
                    Show all
                  </button>
                )}
              </div>
              {renderItems(s.key, data, 3)}
            </section>
          ))
        ) : (
          <>
            {renderItems(tab, data)}
            {data[tab].total > data[tab].items.length && (
              <Link href={SECTIONS.find((s) => s.key === tab)!.viewAll} className="mt-1 block px-2 py-2 text-xs font-medium text-accent hover:underline">
                View all {data[tab].total} →
              </Link>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors',
        active ? 'border-accent bg-accent-soft text-accent' : 'border-line text-fg-2 hover:border-line-strong',
      )}
    >
      {label}
      <span className="tabular opacity-70">{count}</span>
    </button>
  );
}
