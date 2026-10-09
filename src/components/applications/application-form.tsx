'use client';

import { useRouter } from '@/lib/navigation';
import { useState } from 'react';
import {
  APPLIED_VIA_OPTIONS,
  CONNECTION_OPTIONS,
  CURRENCIES,
  JOB_TYPE_OPTIONS,
  MESSAGE_OPTIONS,
  PLATFORM_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  WORKPLACE_OPTIONS,
} from '@/lib/enums';
import { fromDateInput, toDateInput, todayInput } from '@/lib/format';
import { useCreateApplication, useCreateFollowUp, useFacets, useUpdateApplication } from '@/lib/hooks';
import type { Application } from '@/lib/types';
import type { Hue } from '@/lib/enums';
import { Button, Card, Checkbox, Field, Input, Select, Textarea } from '../ui/ui';

type FormState = Record<string, string | boolean>;

function initial(app?: Application): FormState {
  return {
    company: app?.company ?? '',
    position: app?.position ?? '',
    jobUrl: app?.jobUrl ?? '',
    platform: app?.platform ?? 'LINKEDIN',
    appliedVia: app?.appliedVia ?? 'EASY_APPLY',
    jobType: app?.jobType ?? 'FULL_TIME',
    workplace: app?.workplace ?? 'ONSITE',
    location: app?.location ?? '',
    city: app?.city ?? '',
    country: app?.country ?? '',
    salaryMin: app?.salaryMin?.toString() ?? '',
    salaryMax: app?.salaryMax?.toString() ?? '',
    currency: app?.currency ?? '',
    status: app?.status ?? 'APPLIED',
    priority: app?.priority ?? 'MEDIUM',
    appliedAt: app ? toDateInput(app.appliedAt) : todayInput(),
    deadline: toDateInput(app?.deadline),
    resumeVersion: app?.resumeVersion ?? '',
    notes: app?.notes ?? '',
    recruiterName: app?.recruiterName ?? '',
    recruiterEmail: app?.recruiterEmail ?? '',
    recruiterLinkedin: app?.recruiterLinkedin ?? '',
    connectionStatus: app?.connectionStatus ?? 'NOT_SENT',
    msg1Status: app?.msg1Status ?? 'NOT_SENT',
    msg2Status: app?.msg2Status ?? 'NOT_SENT',
    msg3Status: app?.msg3Status ?? 'NOT_SENT',
    recruiterReplied: app?.recruiterReplied ?? false,
    needsReply: app?.needsReply ?? false,
    followUpOn: '',
  };
}

function Section({ title, description, children, hue = 'indigo' }: { title: string; description?: string; children: React.ReactNode; hue?: Hue }) {
  return (
    <Card hue={hue} className="p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export function ApplicationForm({ app }: { app?: Application }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(() => initial(app));
  const create = useCreateApplication();
  const update = useUpdateApplication();
  const createFollowUp = useCreateFollowUp();
  const { data: facets } = useFacets('applications');
  const set = (k: string) => (v: string | boolean) => setF((s) => ({ ...s, [k]: v }));
  const text = (k: string) => ({ value: String(f[k] ?? ''), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k)(e.target.value) });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const str = (k: string) => (String(f[k]).trim() === '' ? null : String(f[k]).trim());
    const int = (k: string) => (String(f[k]).trim() === '' ? null : Math.round(Number(f[k])));
    const body: Partial<Application> = {
      company: String(f.company).trim(),
      position: String(f.position).trim(),
      jobUrl: str('jobUrl'),
      platform: f.platform as Application['platform'],
      appliedVia: f.appliedVia as Application['appliedVia'],
      jobType: f.jobType as Application['jobType'],
      workplace: f.workplace as Application['workplace'],
      location: str('location'),
      city: str('city'),
      country: str('country'),
      salaryMin: int('salaryMin'),
      salaryMax: int('salaryMax'),
      currency: str('currency'),
      status: f.status as Application['status'],
      priority: f.priority as Application['priority'],
      appliedAt: fromDateInput(String(f.appliedAt)) ?? new Date().toISOString(),
      deadline: fromDateInput(String(f.deadline)),
      resumeVersion: str('resumeVersion'),
      notes: str('notes'),
      recruiterName: str('recruiterName'),
      recruiterEmail: str('recruiterEmail'),
      recruiterLinkedin: str('recruiterLinkedin'),
      connectionStatus: f.connectionStatus as Application['connectionStatus'],
      msg1Status: f.msg1Status as Application['msg1Status'],
      msg2Status: f.msg2Status as Application['msg2Status'],
      msg3Status: f.msg3Status as Application['msg3Status'],
      recruiterReplied: Boolean(f.recruiterReplied),
      needsReply: Boolean(f.needsReply),
    };
    if (app) {
      update.mutate({ id: app.id, ...body }, { onSuccess: () => router.push(`/applications/${app.id}`) });
    } else {
      create.mutate(body, {
        onSuccess: async (created) => {
          if (f.followUpOn) await createFollowUp.mutateAsync({ applicationId: created.id, dueAt: fromDateInput(String(f.followUpOn))! }).catch(() => {});
          router.push(`/applications/${created.id}`);
        },
      });
    }
  }

  const pending = create.isPending || update.isPending;

  return (
    <form onSubmit={submit} className="space-y-4">
      <Section title="Job details">
        <Field label="Company" required>
          <Input {...text('company')} required list="company-list" placeholder="e.g. Stripe" autoFocus={!app} />
          <datalist id="company-list">
            {facets?.companies.map((c) => <option key={c.value} value={c.value} />)}
          </datalist>
        </Field>
        <Field label="Position" required>
          <Input {...text('position')} required placeholder="e.g. Frontend Engineer" />
        </Field>
        <Field label="Job URL" className="sm:col-span-2">
          <Input {...text('jobUrl')} type="url" placeholder="https://…" />
        </Field>
        <Field label="Platform">
          <Select value={String(f.platform)} onChange={set('platform')} options={PLATFORM_OPTIONS} />
        </Field>
        <Field label="Applied via">
          <Select value={String(f.appliedVia)} onChange={set('appliedVia')} options={APPLIED_VIA_OPTIONS} />
        </Field>
        <Field label="Job type">
          <Select value={String(f.jobType)} onChange={set('jobType')} options={JOB_TYPE_OPTIONS} />
        </Field>
        <Field label="Workplace">
          <Select value={String(f.workplace)} onChange={set('workplace')} options={WORKPLACE_OPTIONS} />
        </Field>
        <Field label="City">
          <Input {...text('city')} list="city-list" placeholder="e.g. Dhaka" />
          <datalist id="city-list">{facets?.cities.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Country">
          <Input {...text('country')} list="country-list" placeholder="e.g. Bangladesh" />
          <datalist id="country-list">{facets?.countries.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Location note" hint="Optional free text, e.g. “Remote (EU time zones)”" className="sm:col-span-2">
          <Input {...text('location')} />
        </Field>
        <div className="grid grid-cols-[1fr_1fr_110px] gap-2 sm:col-span-2">
          <Field label="Salary min">
            <Input {...text('salaryMin')} type="number" min={0} placeholder="50000" />
          </Field>
          <Field label="Salary max">
            <Input {...text('salaryMax')} type="number" min={0} placeholder="70000" />
          </Field>
          <Field label="Currency">
            <Select value={String(f.currency)} onChange={set('currency')} placeholder="—" options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </Field>
        </div>
      </Section>

      <Section title="Tracking" hue="blue">
        <Field label="Status">
          <Select value={String(f.status)} onChange={set('status')} options={STATUS_OPTIONS} />
        </Field>
        <Field label="Priority">
          <Select value={String(f.priority)} onChange={set('priority')} options={PRIORITY_OPTIONS} />
        </Field>
        <Field label="Applied on">
          <Input {...text('appliedAt')} type="date" max={todayInput()} required />
        </Field>
        <Field label="Deadline" hint="Response, offer or assessment deadline">
          <Input {...text('deadline')} type="date" />
        </Field>
        <Field label="Resume version">
          <Input {...text('resumeVersion')} list="resume-list" placeholder="e.g. v3-frontend" />
          <datalist id="resume-list">{facets?.resumeVersions?.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        {!app && (
          <Field label="Follow up on" hint="Optional — creates a follow-up reminder">
            <Input {...text('followUpOn')} type="date" min={todayInput()} />
          </Field>
        )}
      </Section>

      <Section title="Recruiter" hue="violet" description="Track your outreach from connection request to MSG-3.">
        <Field label="Recruiter name">
          <Input {...text('recruiterName')} />
        </Field>
        <Field label="Recruiter email">
          <Input {...text('recruiterEmail')} type="email" />
        </Field>
        <Field label="Recruiter LinkedIn" className="sm:col-span-2">
          <Input {...text('recruiterLinkedin')} type="url" placeholder="https://linkedin.com/in/…" />
        </Field>
        <Field label="Connection request">
          <Select value={String(f.connectionStatus)} onChange={set('connectionStatus')} options={CONNECTION_OPTIONS} />
        </Field>
        <Field label="MSG-1">
          <Select value={String(f.msg1Status)} onChange={set('msg1Status')} options={MESSAGE_OPTIONS} />
        </Field>
        <Field label="MSG-2">
          <Select value={String(f.msg2Status)} onChange={set('msg2Status')} options={MESSAGE_OPTIONS} />
        </Field>
        <Field label="MSG-3">
          <Select value={String(f.msg3Status)} onChange={set('msg3Status')} options={MESSAGE_OPTIONS} />
        </Field>
        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <Checkbox checked={Boolean(f.recruiterReplied)} onChange={set('recruiterReplied')} label="Recruiter replied" />
          <Checkbox checked={Boolean(f.needsReply)} onChange={set('needsReply')} label="I need to respond" />
        </div>
      </Section>

      <Card className="p-5">
        <Field label="Notes">
          <Textarea {...text('notes')} rows={5} placeholder="Anything worth remembering — referral, tech stack, interview prep…" />
        </Field>
      </Card>

      <div className="sticky bottom-16 z-10 -mx-4 flex justify-end gap-2 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 lg:bottom-0">
        <Button onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" variant="primary" loading={pending}>
          {app ? 'Save changes' : 'Add application'}
        </Button>
      </div>
    </form>
  );
}
