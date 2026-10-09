'use client';

import { AlarmClock, CalendarClock, CheckCircle2, ClipboardList, ExternalLink, Hourglass, MessageSquareReply, Reply, Send, Siren, TimerOff } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { Hue } from '@/lib/enums';
import { INTERVIEW_TYPE_LABEL, TASK_TYPE_LABEL } from '@/lib/enums';
import { ago, daysLeft, fmtDateTime, fmtRelativeDay } from '@/lib/format';
import { useAttention, useUpdateTask } from '@/lib/hooks';
import type { AppRef, Attention, FollowUp, Interview, Task, WishlistJob } from '@/lib/types';
import { FollowUpDoneButton, MarkAppliedButton, MarkRepliedButton, QuickLinks, RescheduleFollowUp, StatusMenu } from '../applications/actions';
import { HScroll, ScrollArea } from '../ui/scroll';
import { Badge, Button, Card, CardHeader, cn, CompanyAvatar, EmptyState, HUE, IconTile, SkeletonRows } from '../ui/ui';

type Key = keyof Omit<Attention, 'total'>;

const SECTIONS: { key: Key; label: string; short: string; icon: React.ElementType; hue: Hue; viewAll: string }[] = [
  { key: 'wishlistOverdue', label: 'Overdue deadlines', short: 'Overdue', icon: TimerOff, hue: 'rose', viewAll: '/wishlist?state=expired' },
  { key: 'followUpsDue', label: 'Follow-ups due', short: 'Follow-ups', icon: MessageSquareReply, hue: 'orange', viewAll: '/applications?followUp=overdue,today' },
  { key: 'wishlistDueSoon', label: 'Deadlines within 3 days', short: 'Deadlines', icon: AlarmClock, hue: 'amber', viewAll: '/wishlist?deadline=3d' },
  { key: 'upcomingInterviews', label: 'Upcoming interviews', short: 'Interviews', icon: CalendarClock, hue: 'indigo', viewAll: '/applications?interview=UPCOMING' },
  { key: 'pendingTasks', label: 'Pending assessments', short: 'Tasks', icon: ClipboardList, hue: 'teal', viewAll: '/applications?task=PENDING' },
  { key: 'needsReply', label: 'Recruiters awaiting your reply', short: 'Replies', icon: Reply, hue: 'violet', viewAll: '/applications?needsReply=yes' },
  { key: 'staleApplications', label: 'No updates for 7+ days', short: 'Stale', icon: Hourglass, hue: 'slate', viewAll: '/applications?activeOnly=yes&inactive=7&sort=lastActivityAt&dir=asc' },
];

function Row({
  href,
  company,
  title,
  meta,
  badge,
  actions,
  stripe,
}: {
  href: string;
  company: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  stripe: string;
}) {
  return (
    <div className="group relative flex flex-col gap-2 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-line hover:bg-surface-2/60 sm:flex-row sm:items-center sm:gap-3">
      <span className="absolute top-3 bottom-3 left-0 w-[3px] rounded-r-full" style={{ background: stripe }} />
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <CompanyAvatar name={company} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{title}</p>
          {meta && <p className="truncate text-[11.5px] text-muted">{meta}</p>}
        </div>
      </Link>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 pl-11 sm:pl-0">
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
      stripe={overdue ? 'var(--critical)' : n <= 1 ? 'var(--serious)' : 'var(--c-amber)'}
      title={
        <>
          {job.company} <span className="font-normal text-fg-2">· {job.position}</span>
        </>
      }
      badge={
        <Badge tone={overdue ? 'critical' : n === 0 ? 'serious' : 'warn'}>
          {overdue ? `${Math.abs(n)}d overdue` : n === 0 ? 'Due today' : n === 1 ? 'Due tomorrow' : `${n} days left`}
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
      stripe={n < 0 ? 'var(--critical)' : 'var(--c-orange)'}
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
      stripe="var(--c-indigo)"
      title={
        <>
          {a.company} <span className="font-normal text-fg-2">· {INTERVIEW_TYPE_LABEL[i.type]}</span>
        </>
      }
      meta={`${fmtDateTime(i.scheduledAt)}${i.location && !i.location.startsWith('http') ? ` · ${i.location}` : ''}`}
      badge={<Badge tone="accent">{fmtRelativeDay(i.scheduledAt)}</Badge>}
      actions={
        i.location?.startsWith('http') ? (
          <a href={i.location} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md bg-accent-soft px-2.5 text-xs font-medium text-accent hover:bg-accent hover:text-white">
            Join <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <Link href={`/applications/${a.id}#interviews`} className="text-xs font-medium text-accent hover:underline">
            Details
          </Link>
        )
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
      stripe={n !== null && n < 0 ? 'var(--critical)' : 'var(--c-teal)'}
      title={
        <>
          {t.title} <span className="font-normal text-fg-2">· {a.company}</span>
        </>
      }
      meta={TASK_TYPE_LABEL[t.type]}
      badge={n !== null ? <Badge tone={n < 0 ? 'critical' : n <= 1 ? 'serious' : 'warn'}>{n < 0 ? `${Math.abs(n)}d overdue` : `Due ${fmtRelativeDay(t.dueAt).toLowerCase()}`}</Badge> : undefined}
      actions={
        <>
          <QuickLinks jobUrl={t.link} />
          <Button size="xs" variant="success" onClick={() => update.mutate({ id: t.id, status: 'SUBMITTED' })} loading={update.isPending}>
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
      stripe="var(--line-strong)"
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
      stripe="var(--c-violet)"
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
  const visible = data ? SECTIONS.filter((s) => data[s.key].total > 0) : [];

  return (
    <Card hue="orange" className="flex h-full flex-col">
      <CardHeader
        hue="orange"
        icon={<Siren />}
        title="Needs my attention"
        subtitle={data ? (data.total ? 'Handle these first — sorted by urgency' : 'You are all caught up') : 'Loading…'}
        count={data?.total}
      />

      {data && data.total > 0 && (
        <HScroll className="border-y border-line bg-surface-2/40" innerClassName="flex gap-1.5 px-4 py-2">
          <TabButton active={tab === 'all'} onClick={() => setTab('all')} label="All" count={data.total} hue="slate" />
          {visible.map((s) => (
            <TabButton key={s.key} active={tab === s.key} onClick={() => setTab(s.key)} label={s.short} count={data[s.key].total} hue={s.hue} icon={<s.icon className="h-3 w-3" />} />
          ))}
        </HScroll>
      )}

      <ScrollArea className="px-2 pt-1 pb-3 lg:max-h-[470px]">
        {isLoading || !data ? (
          <SkeletonRows rows={5} />
        ) : data.total === 0 ? (
          <EmptyState hue="emerald" icon={<CheckCircle2 />} title="Nothing needs your attention" description="No overdue deadlines, follow-ups, interviews, tasks or recruiter replies right now." />
        ) : tab === 'all' ? (
          visible.map((s) => (
            <section key={s.key} className="mt-2">
              <div className="flex items-center justify-between px-3 pt-1 pb-1.5">
                <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.06em] uppercase" style={{ color: HUE[s.hue].fg }}>
                  <IconTile hue={s.hue} size="sm">
                    <s.icon />
                  </IconTile>
                  {s.label}
                  <span className="tabular rounded-full px-1.5 text-[10px]" style={{ background: HUE[s.hue].soft }}>
                    {data[s.key].total}
                  </span>
                </p>
                {data[s.key].total > 3 && (
                  <button onClick={() => setTab(s.key)} className="text-[11px] font-semibold text-accent hover:underline">
                    Show all {data[s.key].total}
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
              <Link href={SECTIONS.find((s) => s.key === tab)!.viewAll} className="mt-1 block px-3 py-2 text-xs font-semibold text-accent hover:underline">
                View all {data[tab].total} →
              </Link>
            )}
          </>
        )}
      </ScrollArea>
    </Card>
  );
}

function TabButton({ active, onClick, label, count, hue, icon }: { active: boolean; onClick: () => void; label: string; count: number; hue: Hue; icon?: React.ReactNode }) {
  const h = HUE[hue];
  return (
    <button
      onClick={onClick}
      className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all', !active && 'bg-surface text-fg-2 ring-1 ring-line ring-inset hover:ring-line-strong')}
      style={active ? { background: h.fg, color: '#fff', boxShadow: `0 2px 8px -2px ${h.fg}` } : undefined}
    >
      {icon && <span style={{ color: active ? '#fff' : h.fg }}>{icon}</span>}
      {label}
      <span className={cn('tabular rounded-full px-1.5 text-[10px]', active ? 'bg-white/20' : '')} style={!active ? { background: h.soft, color: h.fg } : undefined}>
        {count}
      </span>
    </button>
  );
}
