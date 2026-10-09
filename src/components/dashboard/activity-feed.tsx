'use client';

import {
  ArrowRightLeft,
  Bookmark,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  History,
  MailCheck,
  MessageSquare,
  MessageSquareReply,
  Pencil,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ACTIVITY_GROUPS } from '@/lib/enums';
import type { Activity, ActivityType } from '@/lib/types';
import { PillGroup } from '../ui/multi-select';
import { cn, EmptyState, SkeletonRows } from '../ui/ui';

const ICON: Record<ActivityType, { icon: React.ElementType; cls: string }> = {
  APPLICATION_CREATED: { icon: Briefcase, cls: 'bg-info-soft text-info' },
  APPLICATION_UPDATED: { icon: Pencil, cls: 'bg-surface-2 text-fg-2' },
  STATUS_CHANGED: { icon: ArrowRightLeft, cls: 'bg-violet-soft text-violet' },
  WISHLIST_ADDED: { icon: Bookmark, cls: 'bg-warn-soft text-warn' },
  WISHLIST_APPLIED: { icon: Send, cls: 'bg-info-soft text-info' },
  RECRUITER_MESSAGE: { icon: MessageSquare, cls: 'bg-accent-soft text-accent' },
  RECRUITER_REPLY: { icon: MessageSquareReply, cls: 'bg-good-soft text-good' },
  INTERVIEW_SCHEDULED: { icon: CalendarClock, cls: 'bg-accent-soft text-accent' },
  INTERVIEW_UPDATED: { icon: CalendarClock, cls: 'bg-surface-2 text-fg-2' },
  FOLLOWUP_SCHEDULED: { icon: History, cls: 'bg-surface-2 text-fg-2' },
  FOLLOWUP_COMPLETED: { icon: CheckCircle2, cls: 'bg-good-soft text-good' },
  TASK_ADDED: { icon: ClipboardCheck, cls: 'bg-surface-2 text-fg-2' },
  TASK_SUBMITTED: { icon: Send, cls: 'bg-violet-soft text-violet' },
  TASK_COMPLETED: { icon: ClipboardCheck, cls: 'bg-good-soft text-good' },
  REMINDER_SENT: { icon: MailCheck, cls: 'bg-accent-soft text-accent' },
};

function dayLabel(iso: string) {
  const d = parseISO(iso);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM d');
}

export function ActivityTypeFilter({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return <PillGroup options={ACTIVITY_GROUPS.map((g) => ({ value: g.value, label: g.label }))} selected={value} onChange={onChange} />;
}

/** Unified chronological feed grouped by day. */
export function ActivityFeed({ items, loading, dense }: { items?: Activity[]; loading?: boolean; dense?: boolean }) {
  if (loading || !items) return <SkeletonRows rows={dense ? 4 : 8} />;
  if (!items.length) return <EmptyState compact icon={<History />} title="No activity yet" description="Applications, status changes, recruiter messages and completed follow-ups will appear here." />;

  const groups: { day: string; items: Activity[] }[] = [];
  for (const a of items) {
    const day = dayLabel(a.createdAt);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(a);
    else groups.push({ day, items: [a] });
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.day}>
          <p className="sticky top-0 z-[1] bg-surface px-2 py-1 text-[11px] font-semibold tracking-wide text-muted uppercase">{g.day}</p>
          <ol className="relative">
            {g.items.map((a, i) => {
              const { icon: Icon, cls } = ICON[a.type] ?? ICON.APPLICATION_UPDATED;
              const href = a.applicationId ? `/applications/${a.applicationId}` : a.wishlistJobId ? `/wishlist/${a.wishlistJobId}` : undefined;
              const body = (
                <div className={cn('relative flex gap-3 rounded-lg px-2', dense ? 'py-1.5' : 'py-2', href && 'hover:bg-surface-2/70')}>
                  {i < g.items.length - 1 && <span className="absolute top-9 bottom-0 left-[22px] w-px bg-line" aria-hidden />}
                  <span className={cn('relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full', cls)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] leading-snug text-fg">{a.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{format(parseISO(a.createdAt), 'h:mm a')}</p>
                  </div>
                </div>
              );
              return <li key={a.id}>{href ? <Link href={href}>{body}</Link> : body}</li>;
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
