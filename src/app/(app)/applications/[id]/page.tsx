'use client';

import { ArrowLeft, ExternalLink, History, Info, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { StatusMenu } from '@/components/applications/actions';
import { FollowUpsPanel, InterviewsPanel, RecruiterPanel, TasksPanel } from '@/components/applications/detail-panels';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Linkedin } from '@/components/ui/icons';
import { Badge, Button, Card, CardHeader, CompanyAvatar, EmptyState, LinkButton, Skeleton } from '@/components/ui/ui';
import { APPLIED_VIA_LABEL, JOB_TYPE_LABEL, PLATFORM_LABEL, PRIORITY_LABEL, PRIORITY_TONE, WORKPLACE_LABEL } from '@/lib/enums';
import { readStoredQuery } from '@/lib/filters';
import { ago, daysLeft, daysLeftLabel, fmtDate, locationText, money } from '@/lib/format';
import { useApplication, useDeleteApplication } from '@/lib/hooks';

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: app, isLoading, error } = useApplication(id);
  const del = useDeleteApplication();
  const [backHref, setBackHref] = useState('/applications');

  // Return to the list with the exact filters the user came from.
  useEffect(() => {
    const qs = readStoredQuery('zp:apps-qs');
    if (qs) setBackHref(`/applications?${qs}`);
  }, []);

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  if (error || !app)
    return <EmptyState title="Application not found" description="It may have been deleted." action={<LinkButton href="/applications">Back to applications</LinkButton>} />;

  const deadline = daysLeft(app.deadline);
  const details: [string, React.ReactNode][] = [
    ['Applied', fmtDate(app.appliedAt)],
    ['Platform', PLATFORM_LABEL[app.platform]],
    ['Applied via', APPLIED_VIA_LABEL[app.appliedVia]],
    ['Job type', JOB_TYPE_LABEL[app.jobType]],
    ['Workplace', WORKPLACE_LABEL[app.workplace]],
    ['Location', locationText(app)],
    ['Salary', money(app.salaryMin, app.salaryMax, app.currency)],
    ['Deadline', app.deadline ? `${fmtDate(app.deadline)} · ${daysLeftLabel(deadline)}` : '—'],
    ['Resume', app.resumeVersion ?? '—'],
    ['Last activity', ago(app.lastActivityAt)],
  ];

  return (
    <div className="space-y-4">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Applications
      </Link>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            <CompanyAvatar name={app.company} />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{app.position}</h1>
              <p className="truncate text-sm text-fg-2">{app.company}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusMenu id={app.id} status={app.status} />
            <Badge tone={PRIORITY_TONE[app.priority]}>{PRIORITY_LABEL[app.priority]} priority</Badge>
            {app.jobUrl && (
              <LinkButton href={app.jobUrl} external size="sm">
                <ExternalLink className="h-3.5 w-3.5" /> Job link
              </LinkButton>
            )}
            {app.recruiterLinkedin && (
              <LinkButton href={app.recruiterLinkedin} external size="sm">
                <Linkedin className="h-3.5 w-3.5" /> Recruiter
              </LinkButton>
            )}
            <LinkButton href={`/applications/${app.id}/edit`} size="sm">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </LinkButton>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Delete application"
              onClick={() => confirm(`Delete the ${app.company} application?`) && del.mutate(app.id, { onSuccess: () => router.push(backHref) })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <RecruiterPanel app={app} />
          <FollowUpsPanel app={app} />
          <InterviewsPanel app={app} />
          <TasksPanel app={app} />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Details" icon={<Info />} />
            <dl className="divide-y divide-line px-4 pb-2">
              {details.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2 text-[13px]">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          {app.notes && (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-semibold">Notes</h2>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-fg-2">{app.notes}</p>
            </Card>
          )}
          <Card>
            <CardHeader title="Timeline" icon={<History />} />
            <div className="max-h-[520px] overflow-y-auto px-2 pb-3">
              <ActivityFeed items={app.activities} dense />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
