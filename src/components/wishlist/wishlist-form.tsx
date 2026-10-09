'use client';

import { useRouter } from '@/lib/navigation';
import { useState } from 'react';
import type { Hue } from '@/lib/enums';
import { CURRENCIES, JOB_TYPE_OPTIONS, PRIORITY_OPTIONS, WORKPLACE_OPTIONS } from '@/lib/enums';
import { fromDateInput, toDateInput, todayInput } from '@/lib/format';
import { useCreateWishlist, useFacets, useUpdateWishlist } from '@/lib/hooks';
import type { WishlistJob } from '@/lib/types';
import { OptionPicker } from '../ui/option-picker';
import { Button, Card, Checkbox, Field, Input, Select, Textarea } from '../ui/ui';

function Section({ title, description, hue, children }: { title: string; description?: string; hue: Hue; children: React.ReactNode }) {
  return (
    <Card hue={hue} className="p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export function WishlistForm({ job }: { job?: WishlistJob }) {
  const router = useRouter();
  const create = useCreateWishlist();
  const update = useUpdateWishlist();
  const { data: facets } = useFacets('wishlist');
  const [f, setF] = useState({
    company: job?.company ?? '',
    position: job?.position ?? '',
    jobUrl: job?.jobUrl ?? '',
    jobReference: job?.jobReference ?? '',
    platform: job?.platform ?? 'LINKEDIN',
    appliedVia: job?.appliedVia ?? '',
    workplace: job?.workplace ?? 'ONSITE',
    jobType: job?.jobType ?? 'FULL_TIME',
    city: job?.city ?? '',
    country: job?.country ?? '',
    location: job?.location ?? '',
    salaryMin: job?.salaryMin?.toString() ?? '',
    salaryMax: job?.salaryMax?.toString() ?? '',
    currency: job?.currency ?? '',
    companyWebsite: job?.companyWebsite ?? '',
    recruiterName: job?.recruiterName ?? '',
    recruiterEmail: job?.recruiterEmail ?? '',
    recruiterLinkedin: job?.recruiterLinkedin ?? '',
    priority: job?.priority ?? 'MEDIUM',
    deadline: toDateInput(job?.deadline),
    reminderAt: toDateInput(job?.reminderAt),
    reminderSent: job?.reminderSent ?? false,
    notes: job?.notes ?? '',
  });
  const set = (k: keyof typeof f) => (v: string | boolean) => setF((s) => ({ ...s, [k]: v }));
  const text = (k: keyof typeof f) => ({ value: String(f[k]), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k)(e.target.value) });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const s = (v: string) => (v.trim() ? v.trim() : null);
    const n = (v: string) => (v.trim() ? Math.round(Number(v)) : null);
    const body: Partial<WishlistJob> = {
      company: f.company.trim(),
      position: f.position.trim(),
      jobUrl: s(f.jobUrl),
      jobReference: s(f.jobReference),
      platform: f.platform,
      appliedVia: s(f.appliedVia),
      workplace: f.workplace as WishlistJob['workplace'],
      jobType: f.jobType as WishlistJob['jobType'],
      city: s(f.city),
      country: s(f.country),
      location: s(f.location),
      salaryMin: n(f.salaryMin),
      salaryMax: n(f.salaryMax),
      currency: s(f.currency),
      companyWebsite: s(f.companyWebsite),
      recruiterName: s(f.recruiterName),
      recruiterEmail: s(f.recruiterEmail),
      recruiterLinkedin: s(f.recruiterLinkedin),
      priority: f.priority as WishlistJob['priority'],
      deadline: fromDateInput(f.deadline),
      reminderAt: fromDateInput(f.reminderAt),
      reminderSent: f.reminderSent,
      notes: s(f.notes),
    };
    if (job) update.mutate({ id: job.id, ...body }, { onSuccess: () => router.push('/wishlist') });
    else create.mutate(body, { onSuccess: () => router.push('/wishlist') });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Section title="Job" hue="amber">
        <Field label="Company" required>
          <Input {...text('company')} required autoFocus={!job} list="wl-companies" placeholder="e.g. Figma" />
          <datalist id="wl-companies">{facets?.companies.map((c) => <option key={c.value} value={c.value} />)}</datalist>
        </Field>
        <Field label="Position" required>
          <Input {...text('position')} required placeholder="e.g. Frontend Engineer" />
        </Field>
        <Field label="Job URL">
          <Input {...text('jobUrl')} type="url" placeholder="https://…" />
        </Field>
        <Field label="Job ID / reference" hint="Requisition or posting number, if any">
          <Input {...text('jobReference')} placeholder="e.g. REQ-2048" />
        </Field>
        <Field label="Platform" hint="Where you found it — type to add your own">
          <OptionPicker kind="platform" value={f.platform} onChange={set('platform')} />
        </Field>
        <Field label="Apply via" hint="How you plan to apply (copied when you mark it applied)">
          <OptionPicker kind="appliedVia" value={f.appliedVia} onChange={set('appliedVia')} allowEmpty placeholder="Not decided" />
        </Field>
        <Field label="Workplace">
          <Select value={f.workplace} onChange={set('workplace')} options={WORKPLACE_OPTIONS} />
        </Field>
        <Field label="Job type">
          <Select value={f.jobType} onChange={set('jobType')} options={JOB_TYPE_OPTIONS} />
        </Field>
        <Field label="City">
          <Input {...text('city')} />
        </Field>
        <Field label="Country">
          <Input {...text('country')} />
        </Field>
        <Field label="Location note" className="sm:col-span-2">
          <Input {...text('location')} placeholder="e.g. Remote (EU time zones)" />
        </Field>
        <div className="grid grid-cols-[1fr_1fr_110px] gap-2 sm:col-span-2">
          <Field label="Salary min">
            <Input {...text('salaryMin')} type="number" min={0} />
          </Field>
          <Field label="Salary max">
            <Input {...text('salaryMax')} type="number" min={0} />
          </Field>
          <Field label="Currency">
            <Select value={f.currency} onChange={set('currency')} placeholder="—" options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </Field>
        </div>
      </Section>

      <Section title="Company & contact" description="Carried over to the application when you mark it applied." hue="violet">
        <Field label="Company website" className="sm:col-span-2">
          <Input {...text('companyWebsite')} type="url" placeholder="https://company.com" />
        </Field>
        <Field label="Recruiter / contact name">
          <Input {...text('recruiterName')} />
        </Field>
        <Field label="Contact email">
          <Input {...text('recruiterEmail')} type="email" placeholder="hr@company.com" />
        </Field>
        <Field label="Contact LinkedIn" className="sm:col-span-2">
          <Input {...text('recruiterLinkedin')} type="url" placeholder="https://linkedin.com/in/…" />
        </Field>
      </Section>

      <Section title="Deadline & reminders" hue="rose">
        <Field label="Application deadline" hint="Email reminders go out 3 days and 1 day before">
          <Input {...text('deadline')} type="date" />
        </Field>
        <Field label="Priority">
          <Select value={f.priority} onChange={set('priority')} options={PRIORITY_OPTIONS} />
        </Field>
        <Field label="Remind me on" hint="Extra email reminder on this date">
          <Input {...text('reminderAt')} type="date" min={todayInput()} />
        </Field>
        <div className="flex items-end pb-2">
          <Checkbox checked={f.reminderSent} onChange={set('reminderSent')} label="Reminder already sent" />
        </div>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea {...text('notes')} rows={4} />
        </Field>
      </Section>

      <div className="flex justify-end gap-2">
        <Button onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" variant="primary" loading={create.isPending || update.isPending}>
          {job ? 'Save changes' : 'Save to wishlist'}
        </Button>
      </div>
    </form>
  );
}
