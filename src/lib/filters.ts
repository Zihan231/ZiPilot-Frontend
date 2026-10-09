'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import {
  APPLIED_VIA_OPTIONS,
  CONNECTION_OPTIONS,
  JOB_TYPE_OPTIONS,
  MESSAGE_OPTIONS,
  PLATFORM_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  TASK_STATUS_OPTIONS,
  WORKPLACE_OPTIONS,
  type Option,
} from './enums';
import type { Facets } from './types';

export type FacetKey = keyof Facets;

export type FilterDef =
  | { kind: 'multi'; key: string; label: string; group: string; options?: Option[]; facet?: FacetKey; searchable?: boolean; customFrom?: string; customTo?: string }
  | { kind: 'single'; key: string; label: string; group: string; options: Option[] }
  | { kind: 'text'; key: string; label: string; group: string; placeholder?: string }
  | { kind: 'date'; key: string; label: string; group: string; options: Option[]; fromKey: string; toKey: string }
  | { kind: 'salary'; key: 'salary'; label: string; group: string };

export const DATE_PRESETS: Option[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'thisWeek', label: 'This week' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'thisYear', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

const DEADLINE_OPTIONS: Option[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: '3d', label: 'Next 3 days' },
  { value: '7d', label: 'Next 7 days' },
  { value: 'expired', label: 'Expired' },
  { value: 'none', label: 'No deadline' },
  { value: 'custom', label: 'Custom range' },
];

export const APPLICATION_FILTERS: FilterDef[] = [
  { kind: 'date', key: 'applied', label: 'Application date', group: 'Application', options: DATE_PRESETS, fromKey: 'appliedFrom', toKey: 'appliedTo' },
  { kind: 'multi', key: 'status', label: 'Status', group: 'Application', options: STATUS_OPTIONS },
  { kind: 'multi', key: 'company', label: 'Company', group: 'Application', facet: 'companies', searchable: true },
  { kind: 'text', key: 'position', label: 'Position', group: 'Application', placeholder: 'e.g. Frontend' },
  { kind: 'multi', key: 'priority', label: 'Priority', group: 'Application', options: PRIORITY_OPTIONS },
  { kind: 'multi', key: 'platform', label: 'Platform', group: 'Source', options: PLATFORM_OPTIONS },
  { kind: 'multi', key: 'appliedVia', label: 'Applied via', group: 'Source', options: APPLIED_VIA_OPTIONS },
  { kind: 'multi', key: 'resume', label: 'Resume version', group: 'Source', facet: 'resumeVersions', searchable: true },
  { kind: 'multi', key: 'jobType', label: 'Job type', group: 'Job', options: JOB_TYPE_OPTIONS },
  { kind: 'multi', key: 'workplace', label: 'Workplace', group: 'Job', options: WORKPLACE_OPTIONS },
  { kind: 'multi', key: 'country', label: 'Country', group: 'Job', facet: 'countries', searchable: true },
  { kind: 'multi', key: 'city', label: 'City', group: 'Job', facet: 'cities', searchable: true },
  { kind: 'text', key: 'location', label: 'Location search', group: 'Job', placeholder: 'City, country or region' },
  { kind: 'salary', key: 'salary', label: 'Salary', group: 'Job' },
  { kind: 'multi', key: 'deadline', label: 'Deadline', group: 'Job', options: DEADLINE_OPTIONS, customFrom: 'deadlineFrom', customTo: 'deadlineTo' },
  { kind: 'multi', key: 'connection', label: 'Recruiter connection', group: 'Recruiter', options: CONNECTION_OPTIONS },
  { kind: 'multi', key: 'msg1', label: 'MSG-1', group: 'Recruiter', options: MESSAGE_OPTIONS },
  { kind: 'multi', key: 'msg2', label: 'MSG-2', group: 'Recruiter', options: MESSAGE_OPTIONS },
  { kind: 'multi', key: 'msg3', label: 'MSG-3', group: 'Recruiter', options: MESSAGE_OPTIONS },
  { kind: 'single', key: 'replied', label: 'Recruiter replied', group: 'Recruiter', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
  { kind: 'single', key: 'needsReply', label: 'Needs my reply', group: 'Recruiter', options: [{ value: 'yes', label: 'Yes' }] },
  {
    kind: 'multi',
    key: 'followUp',
    label: 'Follow-up',
    group: 'Pipeline',
    options: [
      { value: 'overdue', label: 'Overdue' },
      { value: 'today', label: 'Today' },
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'pending', label: 'Any pending' },
      { value: 'none', label: 'Not set' },
    ],
  },
  { kind: 'multi', key: 'task', label: 'Task', group: 'Pipeline', options: TASK_STATUS_OPTIONS },
  {
    kind: 'multi',
    key: 'interview',
    label: 'Interview',
    group: 'Pipeline',
    options: [
      { value: 'UPCOMING', label: 'Upcoming' },
      { value: 'SCHEDULED', label: 'Scheduled' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'NONE', label: 'None' },
    ],
  },
  {
    kind: 'single',
    key: 'inactive',
    label: 'Last activity',
    group: 'Pipeline',
    options: [
      { value: '3', label: 'No activity 3+ days' },
      { value: '7', label: 'No activity 7+ days' },
      { value: '14', label: 'No activity 14+ days' },
      { value: '30', label: 'No activity 30+ days' },
    ],
  },
  { kind: 'single', key: 'activeOnly', label: 'Active pipeline only', group: 'Pipeline', options: [{ value: 'yes', label: 'Yes' }] },
  {
    kind: 'multi',
    key: 'reached',
    label: 'Stage reached',
    group: 'Pipeline',
    options: [
      { value: 'responded', label: 'Responded' },
      { value: 'screened', label: 'Screening' },
      { value: 'interviewed', label: 'Interview' },
      { value: 'offered', label: 'Offer' },
    ],
  },
  {
    kind: 'multi',
    key: 'missing',
    label: 'Missing data',
    group: 'Data quality',
    options: [
      { value: 'recruiter', label: 'Recruiter' },
      { value: 'email', label: 'Recruiter email' },
      { value: 'linkedin', label: 'Recruiter LinkedIn' },
      { value: 'salary', label: 'Salary' },
      { value: 'deadline', label: 'Deadline' },
      { value: 'jobUrl', label: 'Job URL' },
      { value: 'location', label: 'Location' },
      { value: 'resume', label: 'Resume version' },
    ],
  },
];

export const WISHLIST_FILTERS: FilterDef[] = [
  {
    kind: 'multi',
    key: 'deadline',
    label: 'Deadline urgency',
    group: 'Deadline',
    options: [
      { value: 'overdue', label: 'Expired' },
      { value: 'today', label: 'Today' },
      { value: 'tomorrow', label: 'Tomorrow' },
      { value: '3d', label: 'Next 3 days' },
      { value: '7d', label: 'Next 7 days' },
      { value: '30d', label: 'Next 30 days' },
      { value: 'later', label: 'Later than 7 days' },
      { value: 'none', label: 'Missing deadline' },
      { value: 'custom', label: 'Custom range' },
    ],
    customFrom: 'deadlineFrom',
    customTo: 'deadlineTo',
  },
  { kind: 'multi', key: 'company', label: 'Company', group: 'Job', facet: 'companies', searchable: true },
  { kind: 'text', key: 'position', label: 'Position', group: 'Job', placeholder: 'e.g. Engineer' },
  { kind: 'multi', key: 'platform', label: 'Platform', group: 'Job', options: PLATFORM_OPTIONS },
  { kind: 'multi', key: 'workplace', label: 'Workplace', group: 'Job', options: WORKPLACE_OPTIONS },
  { kind: 'multi', key: 'jobType', label: 'Job type', group: 'Job', options: JOB_TYPE_OPTIONS },
  { kind: 'multi', key: 'country', label: 'Country', group: 'Job', facet: 'countries', searchable: true },
  { kind: 'multi', key: 'city', label: 'City', group: 'Job', facet: 'cities', searchable: true },
  { kind: 'text', key: 'location', label: 'Location search', group: 'Job', placeholder: 'City, country or region' },
  { kind: 'salary', key: 'salary', label: 'Salary', group: 'Job' },
  { kind: 'multi', key: 'priority', label: 'Priority', group: 'Tracking', options: PRIORITY_OPTIONS },
  { kind: 'date', key: 'saved', label: 'Date saved', group: 'Tracking', options: DATE_PRESETS, fromKey: 'savedFrom', toKey: 'savedTo' },
  { kind: 'single', key: 'reminder', label: 'Reminder', group: 'Tracking', options: [{ value: 'sent', label: 'Sent' }, { value: 'pending', label: 'Pending' }] },
];

/** URL keys that are display state rather than filters. */
const NON_FILTER_KEYS = new Set(['sort', 'dir', 'page', 'pageSize', 'q', 'state', 'view']);

export function filterKeys(def: FilterDef): string[] {
  if (def.kind === 'date') return [def.key, def.fromKey, def.toKey];
  if (def.kind === 'salary') return ['salaryMin', 'salaryMax', 'currency'];
  if (def.kind === 'multi' && def.customFrom) return [def.key, def.customFrom, def.customTo!];
  return [def.key];
}

export function isActive(def: FilterDef, p: URLSearchParams) {
  return filterKeys(def).some((k) => p.get(k));
}

export function countActive(defs: FilterDef[], p: URLSearchParams) {
  return defs.filter((d) => isActive(d, p)).length + (p.get('q') ? 1 : 0);
}

const csv = (p: URLSearchParams, k: string) => (p.get(k) ?? '').split(',').filter(Boolean);

export function chipLabel(def: FilterDef, p: URLSearchParams, facets?: Facets): string {
  const labelOf = (opts: Option[] | undefined, v: string) => opts?.find((o) => o.value === v)?.label ?? v;
  switch (def.kind) {
    case 'multi': {
      const vals = csv(p, def.key);
      const parts = vals.map((v) => {
        if (v === 'custom' && def.customFrom) return `${p.get(def.customFrom) ?? '…'} → ${p.get(def.customTo!) ?? '…'}`;
        return labelOf(def.options, v);
      });
      return parts.length > 2 ? `${parts.slice(0, 2).join(', ')} +${parts.length - 2}` : parts.join(', ');
    }
    case 'single':
      return labelOf(def.options, p.get(def.key) ?? '');
    case 'text':
      return `“${p.get(def.key)}”`;
    case 'date': {
      const v = p.get(def.key);
      if (v === 'custom') return `${p.get(def.fromKey) ?? '…'} → ${p.get(def.toKey) ?? '…'}`;
      return labelOf(def.options, v ?? '');
    }
    case 'salary': {
      const min = p.get('salaryMin');
      const max = p.get('salaryMax');
      const cur = p.get('currency');
      const range = min && max ? `${min}–${max}` : min ? `≥ ${min}` : max ? `≤ ${max}` : '';
      return [range, cur].filter(Boolean).join(' ');
    }
  }
}

export type Patch = Record<string, string | string[] | null | undefined>;

/** Filter state lives in the URL: shareable, survives refresh, and restores on browser Back. */
export function useUrlFilters(storageKey?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const params = useMemo(() => new URLSearchParams(search.toString()), [search]);
  const qs = params.toString();

  useEffect(() => {
    if (!storageKey) return;
    try {
      sessionStorage.setItem(storageKey, qs);
    } catch {}
  }, [qs, storageKey]);

  const replace = useCallback(
    (next: URLSearchParams) => {
      const s = next.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const update = useCallback(
    (patch: Patch, opts: { resetPage?: boolean } = {}) => {
      const next = new URLSearchParams(search.toString());
      for (const [k, v] of Object.entries(patch)) {
        const val = Array.isArray(v) ? v.join(',') : v;
        if (val === null || val === undefined || val === '') next.delete(k);
        else next.set(k, val);
      }
      if (opts.resetPage !== false && !('page' in patch)) next.delete('page');
      replace(next);
    },
    [search, replace],
  );

  const clear = useCallback(
    (keep: string[] = ['sort', 'dir', 'pageSize', 'state']) => {
      const next = new URLSearchParams();
      for (const k of keep) {
        const v = search.get(k);
        if (v) next.set(k, v);
      }
      replace(next);
    },
    [search, replace],
  );

  const setAll = useCallback((query: string) => replace(new URLSearchParams(query)), [replace]);

  return {
    params,
    qs,
    get: (k: string) => params.get(k) ?? '',
    getList: (k: string) => csv(params, k),
    update,
    clear,
    setAll,
  };
}

/** Query string with only filter keys (used to compare against presets). */
export function filterOnly(qs: string) {
  const p = new URLSearchParams(qs);
  for (const k of [...p.keys()]) if (NON_FILTER_KEYS.has(k) && k !== 'q') p.delete(k);
  p.sort();
  return p.toString();
}

export function readStoredQuery(key: string) {
  try {
    return sessionStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

export const DEFAULT_APP_PRESETS: { name: string; query: string }[] = [
  { name: 'Awaiting Response', query: 'status=APPLIED' },
  { name: 'Follow Up Needed', query: 'followUp=overdue,today' },
  { name: 'Remote Jobs', query: 'workplace=REMOTE' },
  { name: 'Interviews', query: 'interview=SCHEDULED,COMPLETED' },
  { name: 'Needs My Reply', query: 'needsReply=yes' },
  { name: 'Inactive 14+ days', query: 'activeOnly=yes&inactive=14' },
  { name: 'Missing Recruiter', query: 'missing=recruiter' },
];

export const DEFAULT_WISHLIST_PRESETS: { name: string; query: string }[] = [
  { name: 'Due this week', query: 'deadline=7d' },
  { name: 'High priority', query: 'priority=HIGH' },
  { name: 'Remote', query: 'workplace=REMOTE' },
  { name: 'Missing deadline', query: 'deadline=none' },
];
