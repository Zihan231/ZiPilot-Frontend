'use client';

import { CalendarClock, Check, ClipboardList, ExternalLink, Mail, MessageSquareReply, Plus, RotateCcw, Trash2, UserRound } from 'lucide-react';
import { useState } from 'react';
import {
  CHANNEL_LABEL,
  CHANNEL_OPTIONS,
  CONNECTION_OPTIONS,
  INTERVIEW_STATUS_LABEL,
  INTERVIEW_STATUS_OPTIONS,
  INTERVIEW_TYPE_LABEL,
  INTERVIEW_TYPE_OPTIONS,
  MESSAGE_OPTIONS,
  MESSAGE_TONE,
  TASK_STATUS_LABEL,
  TASK_STATUS_OPTIONS,
  TASK_STATUS_TONE,
  TASK_TYPE_LABEL,
  TASK_TYPE_OPTIONS,
} from '@/lib/enums';
import { daysLeft, fmtDate, fmtDateTime, fmtRelativeDay, fromDateInput, fromDateTimeInput, toDateTimeInput, todayInput } from '@/lib/format';
import {
  useCreateFollowUp,
  useCreateInterview,
  useCreateTask,
  useDeleteFollowUp,
  useDeleteInterview,
  useDeleteTask,
  useReopenFollowUp,
  useUpdateApplication,
  useUpdateInterview,
  useUpdateTask,
} from '@/lib/hooks';
import type { ApplicationDetail, InterviewType, TaskType } from '@/lib/types';
import { Linkedin } from '../ui/icons';
import { Badge, Button, Card, CardHeader, Checkbox, cn, EmptyState, Field, Input, Select, Textarea, Toggle } from '../ui/ui';
import { FollowUpDoneButton, RescheduleFollowUp } from './actions';

// ── Recruiter outreach ──
export function RecruiterPanel({ app }: { app: ApplicationDetail }) {
  const update = useUpdateApplication();
  const patch = (body: Partial<ApplicationDetail>) => update.mutate({ id: app.id, ...body });
  const steps = [
    { key: 'msg1Status', at: app.msg1SentAt, label: 'MSG-1', value: app.msg1Status },
    { key: 'msg2Status', at: app.msg2SentAt, label: 'MSG-2', value: app.msg2Status },
    { key: 'msg3Status', at: app.msg3SentAt, label: 'MSG-3', value: app.msg3Status },
  ] as const;

  return (
    <Card hue="violet">
      <CardHeader
        hue="violet"
        title="Recruiter outreach"
        icon={<UserRound />}
        action={
          <div className="flex items-center gap-1">
            {app.recruiterEmail && (
              <a href={`mailto:${app.recruiterEmail}`} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg" title="Email recruiter">
                <Mail className="h-4 w-4" />
              </a>
            )}
            {app.recruiterLinkedin && (
              <a href={app.recruiterLinkedin} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg" title="Open LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
          </div>
        }
      />
      <div className="space-y-4 px-4 pb-4">
        {app.recruiterName || app.recruiterEmail ? (
          <div className="rounded-lg bg-surface-2/60 px-3 py-2 text-sm">
            <p className="font-medium">{app.recruiterName ?? 'Unnamed recruiter'}</p>
            {app.recruiterEmail && <p className="text-xs text-muted">{app.recruiterEmail}</p>}
          </div>
        ) : (
          <p className="text-xs text-muted">No recruiter added yet — edit the application to add one.</p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Connection">
            <Select size="sm" value={app.connectionStatus} onChange={(v) => patch({ connectionStatus: v as ApplicationDetail['connectionStatus'] })} options={CONNECTION_OPTIONS} />
          </Field>
          {steps.map((s) => (
            <Field key={s.key} label={s.label} hint={s.at ? `Sent ${fmtDate(s.at, 'MMM d')}` : undefined}>
              <Select size="sm" value={s.value} onChange={(v) => patch({ [s.key]: v } as Partial<ApplicationDetail>)} options={MESSAGE_OPTIONS} />
            </Field>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-3">
          <Toggle checked={app.recruiterReplied} onChange={(v) => patch({ recruiterReplied: v })} label="Recruiter replied" />
          <Toggle checked={app.needsReply} onChange={(v) => patch({ needsReply: v })} label="I need to respond" />
          {app.recruiterRepliedAt && <span className="text-xs text-muted">Replied {fmtDate(app.recruiterRepliedAt)}</span>}
          <div className="ml-auto flex gap-1">
            {steps.map((s) => (
              <Badge key={s.key} tone={MESSAGE_TONE[s.value]}>
                {s.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Follow-ups ──
export function FollowUpsPanel({ app }: { app: ApplicationDetail }) {
  const [adding, setAdding] = useState(false);
  const [dueAt, setDueAt] = useState(todayInput(3));
  const [channel, setChannel] = useState('EMAIL');
  const [note, setNote] = useState('');
  const create = useCreateFollowUp();
  const reopen = useReopenFollowUp();
  const del = useDeleteFollowUp();
  const pending = app.followUps.filter((f) => !f.completedAt);
  const done = app.followUps.filter((f) => f.completedAt);

  return (
    <Card hue="orange" id="follow-ups">
      <CardHeader
        hue="orange"
        title="Follow-ups"
        icon={<MessageSquareReply />}
        count={pending.length}
        action={
          <Button size="xs" variant="soft" onClick={() => setAdding((a) => !a)}>
            <Plus className="h-3.5 w-3.5" /> Schedule
          </Button>
        }
      />
      {adding && (
        <form
          className="mx-4 mb-3 grid gap-2 rounded-lg border border-line bg-surface-2/40 p-3 sm:grid-cols-[1fr_1fr]"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              { applicationId: app.id, dueAt: fromDateInput(dueAt)!, channel, note: note || null },
              {
                onSuccess: () => {
                  setAdding(false);
                  setNote('');
                },
              },
            );
          }}
        >
          <Field label="Due date">
            <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
          </Field>
          <Field label="Channel">
            <Select value={channel} onChange={setChannel} options={CHANNEL_OPTIONS} />
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Ask about timeline" />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={create.isPending}>
              Schedule follow-up
            </Button>
          </div>
        </form>
      )}
      <div className="px-2 pb-3">
        {app.followUps.length === 0 && !adding && <EmptyState compact title="No follow-ups" description="Schedule one so it lands in your action center." />}
        {pending.map((f) => {
          const n = daysLeft(f.dueAt) ?? 0;
          return (
            <div key={f.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2/60">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', n < 0 ? 'bg-critical' : n === 0 ? 'bg-serious' : 'bg-info')} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">
                  {n < 0 ? <span className="text-critical">{-n}d overdue</span> : fmtRelativeDay(f.dueAt)} <span className="font-normal text-muted">· {CHANNEL_LABEL[f.channel]}</span>
                </p>
                {f.note && <p className="truncate text-xs text-muted">{f.note}</p>}
              </div>
              <RescheduleFollowUp id={f.id} />
              <FollowUpDoneButton id={f.id} />
            </div>
          );
        })}
        {done.length > 0 && (
          <details className="mt-1 px-2">
            <summary className="cursor-pointer py-1 text-xs text-muted">{done.length} completed</summary>
            {done.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-1.5 text-xs text-muted">
                <Check className="h-3.5 w-3.5 text-good" />
                <span className="flex-1">
                  Due {fmtDate(f.dueAt, 'MMM d')} · done {fmtDate(f.completedAt, 'MMM d')}
                  {f.note ? ` · ${f.note}` : ''}
                </span>
                <button onClick={() => reopen.mutate(f.id)} className="rounded p-1 hover:text-fg" title="Reopen">
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button onClick={() => del.mutate(f.id)} className="rounded p-1 hover:text-critical" title="Delete">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </details>
        )}
      </div>
    </Card>
  );
}

// ── Interviews ──
export function InterviewsPanel({ app }: { app: ApplicationDetail }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ type: 'PHONE_SCREEN', scheduledAt: '', durationMinutes: '45', location: '', interviewer: '', notes: '' });
  const create = useCreateInterview();
  const update = useUpdateInterview();
  const del = useDeleteInterview();
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Card hue="indigo" id="interviews">
      <CardHeader
        hue="indigo"
        title="Interviews"
        icon={<CalendarClock />}
        count={app.interviews.length}
        action={
          <Button size="xs" variant="soft" onClick={() => setAdding((a) => !a)}>
            <Plus className="h-3.5 w-3.5" /> Schedule
          </Button>
        }
      />
      {adding && (
        <form
          className="mx-4 mb-3 grid gap-2 rounded-lg border border-line bg-surface-2/40 p-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              {
                applicationId: app.id,
                type: form.type as InterviewType,
                scheduledAt: fromDateTimeInput(form.scheduledAt)!,
                durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
                location: form.location || null,
                interviewer: form.interviewer || null,
                notes: form.notes || null,
              },
              { onSuccess: () => setAdding(false) },
            );
          }}
        >
          <Field label="Type">
            <Select value={form.type} onChange={set('type')} options={INTERVIEW_TYPE_OPTIONS} />
          </Field>
          <Field label="Date & time">
            <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt')(e.target.value)} required />
          </Field>
          <Field label="Duration (min)">
            <Input type="number" min={0} value={form.durationMinutes} onChange={(e) => set('durationMinutes')(e.target.value)} />
          </Field>
          <Field label="Interviewer">
            <Input value={form.interviewer} onChange={(e) => set('interviewer')(e.target.value)} />
          </Field>
          <Field label="Location / meeting link" className="sm:col-span-2">
            <Input value={form.location} onChange={(e) => set('location')(e.target.value)} placeholder="https://meet.google.com/… or office address" />
          </Field>
          <Field label="Prep notes" className="sm:col-span-2">
            <Textarea rows={2} className="min-h-0" value={form.notes} onChange={(e) => set('notes')(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={create.isPending}>
              Save interview
            </Button>
          </div>
        </form>
      )}
      <div className="space-y-1 px-2 pb-3">
        {app.interviews.length === 0 && !adding && <EmptyState compact title="No interviews yet" description="Scheduling one moves this application to the Interview stage." />}
        {app.interviews.map((i) => (
          <div key={i.id} className="group rounded-lg px-2 py-2 hover:bg-surface-2/60">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-medium">{INTERVIEW_TYPE_LABEL[i.type]}</p>
              <Badge tone={i.status === 'SCHEDULED' ? 'accent' : i.status === 'COMPLETED' ? 'good' : 'neutral'}>{INTERVIEW_STATUS_LABEL[i.status]}</Badge>
              <span className="text-xs text-muted">{fmtDateTime(i.scheduledAt)}</span>
              <div className="ml-auto flex items-center gap-1">
                <Select
                  size="sm"
                  className="h-7 w-auto text-xs"
                  value={i.status}
                  onChange={(v) => update.mutate({ id: i.id, status: v as typeof i.status })}
                  options={INTERVIEW_STATUS_OPTIONS}
                  aria-label="Interview status"
                />
                <Input
                  type="datetime-local"
                  className="h-7 w-auto text-xs"
                  defaultValue={toDateTimeInput(i.scheduledAt)}
                  onBlur={(e) => e.target.value && e.target.value !== toDateTimeInput(i.scheduledAt) && update.mutate({ id: i.id, scheduledAt: fromDateTimeInput(e.target.value)! })}
                  aria-label="Reschedule interview"
                />
                <button onClick={() => confirm('Delete this interview?') && del.mutate(i.id)} className="rounded p-1 text-muted opacity-0 group-hover:opacity-100 hover:text-critical" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-0.5 text-xs text-muted">
              {[i.interviewer && `with ${i.interviewer}`, i.durationMinutes && `${i.durationMinutes} min`].filter(Boolean).join(' · ')}
              {i.location &&
                (i.location.startsWith('http') ? (
                  <a href={i.location} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-accent hover:underline">
                    Join <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="ml-2">{i.location}</span>
                ))}
            </div>
            {i.notes && <p className="mt-1 text-xs whitespace-pre-wrap text-fg-2">{i.notes}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Tasks / assessments ──
export function TasksPanel({ app }: { app: ApplicationDetail }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'CODING_ASSESSMENT', dueAt: '', link: '' });
  const create = useCreateTask();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Card hue="teal" id="tasks">
      <CardHeader
        hue="teal"
        title="Assessments & tasks"
        icon={<ClipboardList />}
        count={app.tasks.filter((t) => t.status === 'PENDING').length}
        action={
          <Button size="xs" variant="soft" onClick={() => setAdding((a) => !a)}>
            <Plus className="h-3.5 w-3.5" /> Add task
          </Button>
        }
      />
      {adding && (
        <form
          className="mx-4 mb-3 grid gap-2 rounded-lg border border-line bg-surface-2/40 p-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              { applicationId: app.id, title: form.title, type: form.type as TaskType, dueAt: fromDateTimeInput(form.dueAt), link: form.link || null },
              {
                onSuccess: () => {
                  setAdding(false);
                  setForm({ title: '', type: 'CODING_ASSESSMENT', dueAt: '', link: '' });
                },
              },
            );
          }}
        >
          <Field label="Title" className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => set('title')(e.target.value)} required placeholder="e.g. HackerRank assessment" />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={set('type')} options={TASK_TYPE_OPTIONS} />
          </Field>
          <Field label="Due">
            <Input type="datetime-local" value={form.dueAt} onChange={(e) => set('dueAt')(e.target.value)} />
          </Field>
          <Field label="Link" className="sm:col-span-2">
            <Input type="url" value={form.link} onChange={(e) => set('link')(e.target.value)} placeholder="https://…" />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={create.isPending}>
              Add task
            </Button>
          </div>
        </form>
      )}
      <div className="px-2 pb-3">
        {app.tasks.length === 0 && !adding && <EmptyState compact title="No tasks" description="Track coding assessments and take-home assignments here." />}
        {app.tasks.map((t) => {
          const n = daysLeft(t.dueAt);
          return (
            <div key={t.id} className="group flex flex-wrap items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface-2/60">
              <Checkbox checked={t.status === 'COMPLETED'} onChange={(v) => update.mutate({ id: t.id, status: v ? 'COMPLETED' : 'PENDING' })} />
              <div className="min-w-0 flex-1">
                <p className={cn('text-[13px] font-medium', t.status === 'COMPLETED' && 'text-muted line-through')}>{t.title}</p>
                <p className="text-xs text-muted">
                  {TASK_TYPE_LABEL[t.type]}
                  {t.dueAt && (
                    <span className={cn(n !== null && n < 0 && t.status === 'PENDING' && 'text-critical')}> · due {fmtDateTime(t.dueAt)}</span>
                  )}
                </p>
              </div>
              {t.link && (
                <a href={t.link} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-muted hover:text-fg" title="Open task link">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <Badge tone={TASK_STATUS_TONE[t.status]}>{TASK_STATUS_LABEL[t.status]}</Badge>
              <Select size="sm" className="h-7 w-auto text-xs" value={t.status} onChange={(v) => update.mutate({ id: t.id, status: v as typeof t.status })} options={TASK_STATUS_OPTIONS} aria-label="Task status" />
              <button onClick={() => confirm('Delete this task?') && del.mutate(t.id)} className="rounded p-1 text-muted opacity-0 group-hover:opacity-100 hover:text-critical" title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
