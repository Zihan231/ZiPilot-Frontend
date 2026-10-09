'use client';

import { BellRing, CheckCircle2, Mail, MailWarning, Send } from 'lucide-react';
import { ago } from '@/lib/format';
import { useNotificationStatus, useRunReminders, useSendTestEmail } from '@/lib/hooks';
import { Button, Card, IconTile, Skeleton } from '../ui/ui';

/** Shows whether deadline reminder emails are active, where they go, and lets the user test delivery. */
export function EmailRemindersCard() {
  const { data, isLoading } = useNotificationStatus();
  const test = useSendTestEmail();
  const run = useRunReminders();

  if (isLoading || !data) return <Skeleton className="h-[74px] rounded-2xl" />;

  if (!data.configured) {
    return (
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <IconTile hue="amber" size="lg">
          <MailWarning />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Email reminders are off</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            Add your Gmail address and a Google App Password as <code className="rounded bg-surface-2 px-1">SMTP_USER</code> and{' '}
            <code className="rounded bg-surface-2 px-1">SMTP_PASS</code> in <code className="rounded bg-surface-2 px-1">backend/.env</code>, then restart the API.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card hue="indigo" className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <IconTile hue="indigo" size="lg">
        <BellRing />
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold">
          Deadline email reminders are on <CheckCircle2 className="h-4 w-4 text-good" />
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">
          <Mail className="mr-1 inline h-3 w-3" />
          {data.recipient} · {data.schedule} · 3 days and 1 day before each deadline
          {data.lastSentAt ? ` · last sent ${ago(data.lastSentAt)}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button size="sm" onClick={() => test.mutate()} loading={test.isPending}>
          <Mail className="h-3.5 w-3.5" /> Send test email
        </Button>
        {data.pendingNow > 0 && (
          <Button size="sm" variant="soft" onClick={() => run.mutate()} loading={run.isPending}>
            <Send className="h-3.5 w-3.5" /> Send {data.pendingNow} due now
          </Button>
        )}
      </div>
    </Card>
  );
}
