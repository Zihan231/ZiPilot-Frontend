'use client';

import { CalendarClock, Check, ChevronDown, ExternalLink, Mail, MoreHorizontal, Pencil, Send, Trash2 } from 'lucide-react';
import { Linkedin } from '../ui/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { STATUS_LABEL, STATUS_OPTIONS, STATUS_TONE } from '@/lib/enums';
import { fromDateInput, todayInput } from '@/lib/format';
import { useApplyWishlist, useCompleteFollowUp, useDeleteApplication, useSetStatus, useUpdateApplication, useUpdateFollowUp } from '@/lib/hooks';
import type { ApplicationStatus } from '@/lib/types';
import { MenuItem, MenuLabel, MenuSeparator, Popover } from '../ui/overlay';
import { Badge, Button, cn, Input } from '../ui/ui';

const toneDot: Record<string, string> = {
  info: 'bg-info',
  violet: 'bg-violet',
  warn: 'bg-warn',
  accent: 'bg-accent',
  good: 'bg-good',
  critical: 'bg-critical',
  neutral: 'bg-muted',
  serious: 'bg-serious',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** Status badge that doubles as an inline "Change Status" control. */
export function StatusMenu({ id, status, compact }: { id: string; status: ApplicationStatus; compact?: boolean }) {
  const setStatus = useSetStatus();
  return (
    <Popover
      width={190}
      trigger={({ toggle }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          className="group inline-flex items-center gap-0.5 rounded-md focus-visible:outline-2 focus-visible:outline-accent"
          aria-label={`Change status (currently ${STATUS_LABEL[status]})`}
        >
          <StatusBadge status={status} />
          {!compact && <ChevronDown className="h-3 w-3 text-muted opacity-0 transition-opacity group-hover:opacity-100" />}
        </button>
      )}
    >
      <MenuLabel>Change status</MenuLabel>
      {STATUS_OPTIONS.map((o) => (
        <MenuItem key={o.value} active={o.value === status} onSelect={() => o.value !== status && setStatus.mutate({ id, status: o.value })}>
          <span className={cn('h-2 w-2 rounded-full', toneDot[STATUS_TONE[o.value]])} />
          <span className="flex-1">{o.label}</span>
          {o.value === status && <Check className="h-3.5 w-3.5 text-accent" />}
        </MenuItem>
      ))}
    </Popover>
  );
}

export function FollowUpDoneButton({ id, size = 'xs' }: { id: string; size?: 'xs' | 'sm' }) {
  const complete = useCompleteFollowUp();
  return (
    <Button
      size={size}
      variant="success"
      loading={complete.isPending}
      onClick={(e) => {
        e.stopPropagation();
        complete.mutate({ id });
      }}
    >
      {!complete.isPending && <Check className="h-3.5 w-3.5" />} Done
    </Button>
  );
}

export function RescheduleFollowUp({ id, size = 'xs' }: { id: string; size?: 'xs' | 'sm' }) {
  const update = useUpdateFollowUp();
  const [date, setDate] = useState(todayInput(1));
  const quick = [
    { label: 'Tomorrow', days: 1 },
    { label: 'In 3 days', days: 3 },
    { label: 'Next week', days: 7 },
    { label: 'In 2 weeks', days: 14 },
  ];
  return (
    <Popover
      width={220}
      align="end"
      trigger={({ toggle }) => (
        <Button
          size={size}
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          title="Reschedule follow-up"
          aria-label="Reschedule follow-up"
        >
          <CalendarClock className="h-3.5 w-3.5" />
          <span className={size === 'sm' ? '' : 'hidden xl:inline'}>Snooze</span>
        </Button>
      )}
    >
      {(close) => (
        <div className="p-1" onClick={(e) => e.stopPropagation()}>
          <p className="px-1.5 pt-1 pb-2 text-[11px] font-semibold tracking-wide text-muted uppercase">Reschedule to</p>
          <div className="grid grid-cols-2 gap-1">
            {quick.map((q) => (
              <button
                key={q.label}
                className="rounded-md border border-line px-2 py-1.5 text-xs hover:bg-surface-2"
                onClick={() => {
                  update.mutate({ id, dueAt: fromDateInput(todayInput(q.days))! });
                  close();
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs" />
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (date) update.mutate({ id, dueAt: fromDateInput(date)! });
                close();
              }}
            >
              Set
            </Button>
          </div>
        </div>
      )}
    </Popover>
  );
}

export function MarkAppliedButton({ id, size = 'xs', label = 'Mark Applied' }: { id: string; size?: 'xs' | 'sm'; label?: string }) {
  const apply = useApplyWishlist();
  const router = useRouter();
  return (
    <Button
      size={size}
      variant="soft"
      loading={apply.isPending}
      onClick={(e) => {
        e.stopPropagation();
        apply.mutate({ id }, { onSuccess: (app) => router.prefetch(`/applications/${app.id}`) });
      }}
    >
      {!apply.isPending && <Send className="h-3.5 w-3.5" />} {label}
    </Button>
  );
}

export function MarkRepliedButton({ id }: { id: string }) {
  const update = useUpdateApplication();
  return (
    <Button
      size="xs"
      variant="success"
      loading={update.isPending}
      onClick={(e) => {
        e.stopPropagation();
        update.mutate({ id, needsReply: false });
      }}
      title="Mark that you have responded to the recruiter"
    >
      {!update.isPending && <Check className="h-3.5 w-3.5" />} Responded
    </Button>
  );
}

/** Row "…" menu: open job link, recruiter LinkedIn/email, edit, delete. */
export function ApplicationRowMenu({
  app,
}: {
  app: { id: string; company: string; jobUrl: string | null; recruiterLinkedin: string | null; recruiterEmail?: string | null };
}) {
  const router = useRouter();
  const del = useDeleteApplication();
  return (
    <Popover
      align="end"
      width={220}
      trigger={({ toggle }) => (
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          aria-label="More actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}
    >
      <MenuItem icon={<ExternalLink />} href={app.jobUrl ?? undefined} external disabled={!app.jobUrl}>
        Open job link
      </MenuItem>
      <MenuItem icon={<Linkedin />} href={app.recruiterLinkedin ?? undefined} external disabled={!app.recruiterLinkedin}>
        Open recruiter LinkedIn
      </MenuItem>
      <MenuItem icon={<Mail />} href={app.recruiterEmail ? `mailto:${app.recruiterEmail}` : undefined} disabled={!app.recruiterEmail}>
        Email recruiter
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={<Pencil />} onSelect={() => router.push(`/applications/${app.id}/edit`)}>
        Edit application
      </MenuItem>
      <MenuItem
        icon={<Trash2 />}
        danger
        onSelect={() => {
          if (confirm(`Delete the ${app.company} application? This cannot be undone.`)) del.mutate(app.id);
        }}
      >
        Delete
      </MenuItem>
    </Popover>
  );
}

export function QuickLinks({ jobUrl, linkedin }: { jobUrl?: string | null; linkedin?: string | null }) {
  return (
    <span className="inline-flex items-center">
      {jobUrl && (
        <a
          href={jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
          title="Open job link"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      {linkedin && (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
          title="Open recruiter LinkedIn"
        >
          <Linkedin className="h-3.5 w-3.5" />
        </a>
      )}
    </span>
  );
}
