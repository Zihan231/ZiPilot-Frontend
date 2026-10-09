'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CURRENCIES, JOB_TYPE_OPTIONS, PLATFORM_OPTIONS, PRIORITY_OPTIONS, WORKPLACE_OPTIONS } from '@/lib/enums';
import { fromDateInput, toDateInput, todayInput } from '@/lib/format';
import { useCreateWishlist, useFacets, useUpdateWishlist } from '@/lib/hooks';
import type { WishlistJob } from '@/lib/types';
import { Button, Card, Checkbox, Field, Input, Select, Textarea } from '../ui/ui';

export function WishlistForm({ job }: { job?: WishlistJob }) {
  const router = useRouter();
  const create = useCreateWishlist();
  const update = useUpdateWishlist();
  const { data: facets } = useFacets('wishlist');
  const [f, setF] = useState({
    company: job?.company ?? '',
    position: job?.position ?? '',
    jobUrl: job?.jobUrl ?? '',
    platform: job?.platform ?? 'LINKEDIN',
    workplace: job?.workplace ?? 'ONSITE',
    jobType: job?.jobType ?? 'FULL_TIME',
    city: job?.city ?? '',
    country: job?.country ?? '',
    location: job?.location ?? '',
    salaryMin: job?.salaryMin?.toString() ?? '',
    salaryMax: job?.salaryMax?.toString() ?? '',
    currency: job?.currency ?? '',
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
      platform: f.platform as WishlistJob['platform'],
      workplace: f.workplace as WishlistJob['workplace'],
      jobType: f.jobType as WishlistJob['jobType'],
      city: s(f.city),
      country: s(f.country),
      location: s(f.location),
      salaryMin: n(f.salaryMin),
      salaryMax: n(f.salaryMax),
      currency: s(f.currency),
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
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Company" required>
          <Input {...text('company')} required autoFocus={!job} list="wl-companies" />
          <datalist id="wl-companies">{facets?.companies.map((c) => <option key={c.value} value={c.value} />)}</datalist>
        </Field>
        <Field label="Position" required>
          <Input {...text('position')} required />
        </Field>
        <Field label="Job URL" className="sm:col-span-2">
          <Input {...text('jobUrl')} type="url" placeholder="https://…" />
        </Field>
        <Field label="Application deadline" hint="Drives urgency, reminders and sorting">
          <Input {...text('deadline')} type="date" />
        </Field>
        <Field label="Priority">
          <Select value={f.priority} onChange={set('priority')} options={PRIORITY_OPTIONS} />
        </Field>
        <Field label="Platform">
          <Select value={f.platform} onChange={set('platform')} options={PLATFORM_OPTIONS} />
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
        <Field label="Location note">
          <Input {...text('location')} />
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
        <Field label="Remind me on">
          <Input {...text('reminderAt')} type="date" min={todayInput()} />
        </Field>
        <div className="flex items-end pb-2">
          <Checkbox checked={f.reminderSent} onChange={set('reminderSent')} label="Reminder already sent" />
        </div>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea {...text('notes')} rows={4} />
        </Field>
      </Card>
      <div className="flex justify-end gap-2">
        <Button onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" variant="primary" loading={create.isPending || update.isPending}>
          {job ? 'Save changes' : 'Save to wishlist'}
        </Button>
      </div>
    </form>
  );
}
