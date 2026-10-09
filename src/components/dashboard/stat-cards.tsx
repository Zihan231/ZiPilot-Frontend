'use client';

import {
  Bookmark,
  Briefcase,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Clock,
  Hourglass,
  MessageSquareReply,
  ScanSearch,
  Trophy,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { DashboardCard } from '@/lib/types';
import { cn, Skeleton } from '../ui/ui';

const ICONS: Record<string, React.ElementType> = {
  total: Briefcase,
  week: CalendarDays,
  month: CalendarCheck,
  awaiting: Hourglass,
  screening: ScanSearch,
  interviews: CalendarClock,
  offers: Trophy,
  rejected: XCircle,
  wishlist: Bookmark,
  deadlines: Clock,
  followups: MessageSquareReply,
  tasks: ClipboardList,
};

const ACCENT: Record<string, string> = {
  interviews: 'text-accent bg-accent-soft',
  offers: 'text-good bg-good-soft',
  rejected: 'text-critical bg-critical-soft',
  deadlines: 'text-warn bg-warn-soft',
  followups: 'text-serious bg-serious-soft',
  tasks: 'text-violet bg-violet-soft',
};

export function cardHref(c: Pick<DashboardCard, 'target' | 'query'>) {
  const qs = new URLSearchParams(c.query).toString();
  return `/${c.target}${qs ? `?${qs}` : ''}`;
}

/** Overview cards. Each links to the matching list with the same filters, so counts always agree. */
export function StatCards({ cards, rangeLabel, loading, followUpsDue }: { cards?: DashboardCard[]; rangeLabel?: string; loading?: boolean; followUpsDue?: number }) {
  if (loading || !cards) {
    return (
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="min-w-[150px] rounded-xl border border-line bg-surface p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-12" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 xl:grid-cols-6">
      {cards.map((c) => {
        const Icon = ICONS[c.key] ?? Briefcase;
        const caption = c.key === 'followups' && followUpsDue ? `${followUpsDue} due now` : c.live ? 'Right now' : rangeLabel;
        return (
          <Link
            key={c.key}
            href={cardHref(c)}
            className="group min-w-[150px] snap-start rounded-xl border border-line bg-surface p-3.5 shadow-card transition-all hover:-translate-y-px hover:border-line-strong hover:shadow-pop sm:min-w-0"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs leading-tight font-medium text-fg-2 group-hover:text-fg">{c.label}</p>
              <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', ACCENT[c.key] ?? 'bg-surface-2 text-fg-2')}>
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="tabular mt-1 text-2xl font-semibold tracking-tight">{c.count.toLocaleString()}</p>
            <p className={cn('mt-0.5 text-[11px]', c.key === 'followups' && followUpsDue ? 'font-medium text-serious' : 'text-muted')}>{caption}</p>
          </Link>
        );
      })}
    </div>
  );
}
