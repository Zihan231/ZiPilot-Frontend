'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from './api';
import { useAuth } from './auth';
import type {
  Activity,
  Analytics,
  Application,
  ApplicationDetail,
  ApplicationRow,
  ApplicationStatus,
  Attention,
  DashboardOverview,
  Facets,
  FilterPreset,
  FollowUp,
  Interview,
  Me,
  Paged,
  SearchResults,
  Task,
  WishlistJob,
} from './types';

/** Everything derived from applications/wishlist data — invalidated after any write so dashboard, tables and charts stay consistent. */
const DATA_KEYS = ['applications', 'application', 'wishlist', 'wishlist-item', 'dashboard', 'attention', 'analytics', 'activity', 'search', 'facets'];

export function invalidateData(qc: QueryClient) {
  return Promise.all(DATA_KEYS.map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

function useEnabled() {
  const { user } = useAuth();
  return !!user;
}

// ── Queries ──
export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/me'), enabled: useEnabled(), staleTime: 60_000 });

export const useApplications = (qs: string) =>
  useQuery({
    queryKey: ['applications', qs],
    queryFn: () => api<Paged<ApplicationRow>>('/applications', { query: qs }),
    placeholderData: keepPreviousData,
    enabled: useEnabled(),
  });

export const useApplication = (id: string) =>
  useQuery({ queryKey: ['application', id], queryFn: () => api<ApplicationDetail>(`/applications/${id}`), enabled: useEnabled() && !!id });

export const useFacets = (scope: 'applications' | 'wishlist') =>
  useQuery({ queryKey: ['facets', scope], queryFn: () => api<Facets>(`/${scope}/facets`), enabled: useEnabled(), staleTime: 60_000 });

export const useWishlist = (qs: string, opts: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: ['wishlist', qs],
    queryFn: () => api<Paged<WishlistJob>>('/wishlist', { query: qs }),
    placeholderData: keepPreviousData,
    enabled: useEnabled() && opts.enabled !== false,
  });

export const useWishlistItem = (id: string) =>
  useQuery({ queryKey: ['wishlist-item', id], queryFn: () => api<WishlistJob>(`/wishlist/${id}`), enabled: useEnabled() && !!id });

export const useOverview = (qs: string) =>
  useQuery({ queryKey: ['dashboard', qs], queryFn: () => api<DashboardOverview>('/dashboard/overview', { query: qs }), placeholderData: keepPreviousData, enabled: useEnabled() });

export const useAttention = () => useQuery({ queryKey: ['attention'], queryFn: () => api<Attention>('/dashboard/attention'), enabled: useEnabled() });

export const useAnalytics = (qs: string) =>
  useQuery({ queryKey: ['analytics', qs], queryFn: () => api<Analytics>('/dashboard/analytics', { query: qs }), placeholderData: keepPreviousData, enabled: useEnabled() });

export const useActivity = (qs: string) =>
  useQuery({
    queryKey: ['activity', qs],
    queryFn: () => api<Paged<Activity>>('/activity', { query: qs }),
    placeholderData: keepPreviousData,
    enabled: useEnabled(),
  });

export const useSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => api<SearchResults>('/search', { query: { q } }),
    enabled: useEnabled() && q.trim().length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

export const usePresets = (scope: FilterPreset['scope']) =>
  useQuery({ queryKey: ['presets', scope], queryFn: () => api<FilterPreset[]>('/presets', { query: { scope } }), enabled: useEnabled() });

// ── Mutations ──
function useDataMutation<TVars, TRes = unknown>(fn: (v: TVars) => Promise<TRes>, success?: string | ((r: TRes, v: TVars) => string | undefined)) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r, v) => {
      invalidateData(qc);
      const msg = typeof success === 'function' ? success(r, v) : success;
      if (msg) toast.success(msg);
    },
    onError: (e: Error) => toast.error(e.message || 'Something went wrong'),
  });
}

export const useCreateApplication = () => useDataMutation((body: Partial<Application>) => api<Application>('/applications', { method: 'POST', body }), 'Application added');
export const useUpdateApplication = () =>
  useDataMutation(({ id, ...body }: Partial<Application> & { id: string }) => api<Application>(`/applications/${id}`, { method: 'PATCH', body }), 'Saved');
export const useSetStatus = () =>
  useDataMutation(
    ({ id, status }: { id: string; status: ApplicationStatus }) => api<Application>(`/applications/${id}/status`, { method: 'PATCH', body: { status } }),
    'Status updated',
  );
export const useDeleteApplication = () => useDataMutation((id: string) => api(`/applications/${id}`, { method: 'DELETE' }), 'Application deleted');
export const useBulkStatus = () =>
  useDataMutation(
    (body: { ids: string[]; status: ApplicationStatus }) => api<{ updated: number }>('/applications/bulk/status', { method: 'POST', body }),
    (r) => `Updated ${r.updated} applications`,
  );
export const useBulkDelete = () =>
  useDataMutation((ids: string[]) => api<{ deleted: number }>('/applications/bulk/delete', { method: 'POST', body: { ids } }), (r) => `Deleted ${r.deleted} applications`);

export const useCreateWishlist = () => useDataMutation((body: Partial<WishlistJob>) => api<WishlistJob>('/wishlist', { method: 'POST', body }), 'Saved to wishlist');
export const useUpdateWishlist = () =>
  useDataMutation(({ id, ...body }: Partial<WishlistJob> & { id: string }) => api<WishlistJob>(`/wishlist/${id}`, { method: 'PATCH', body }), 'Saved');
export const useDeleteWishlist = () => useDataMutation((id: string) => api(`/wishlist/${id}`, { method: 'DELETE' }), 'Removed from wishlist');
export const useApplyWishlist = () =>
  useDataMutation(
    ({ id, ...body }: { id: string; appliedAt?: string; appliedVia?: string; resumeVersion?: string | null }) =>
      api<Application>(`/wishlist/${id}/apply`, { method: 'POST', body }),
    (r) => `Marked applied — ${r.company}`,
  );

export const useCreateFollowUp = () =>
  useDataMutation(
    ({ applicationId, ...body }: { applicationId: string; dueAt: string; channel?: string; note?: string | null }) =>
      api<FollowUp>(`/applications/${applicationId}/follow-ups`, { method: 'POST', body }),
    'Follow-up scheduled',
  );
export const useUpdateFollowUp = () =>
  useDataMutation(({ id, ...body }: { id: string; dueAt?: string; channel?: string; note?: string | null }) => api<FollowUp>(`/follow-ups/${id}`, { method: 'PATCH', body }), 'Follow-up rescheduled');
export const useCompleteFollowUp = () =>
  useDataMutation(({ id, nextDueAt }: { id: string; nextDueAt?: string }) => api<FollowUp>(`/follow-ups/${id}/complete`, { method: 'POST', body: { nextDueAt } }), 'Follow-up done');
export const useReopenFollowUp = () => useDataMutation((id: string) => api<FollowUp>(`/follow-ups/${id}/reopen`, { method: 'POST' }));
export const useDeleteFollowUp = () => useDataMutation((id: string) => api(`/follow-ups/${id}`, { method: 'DELETE' }), 'Follow-up removed');

export const useCreateInterview = () =>
  useDataMutation(({ applicationId, ...body }: Partial<Interview> & { applicationId: string }) => api<Interview>(`/applications/${applicationId}/interviews`, { method: 'POST', body }), 'Interview scheduled');
export const useUpdateInterview = () =>
  useDataMutation(({ id, ...body }: Partial<Interview> & { id: string }) => api<Interview>(`/interviews/${id}`, { method: 'PATCH', body }), 'Interview updated');
export const useDeleteInterview = () => useDataMutation((id: string) => api(`/interviews/${id}`, { method: 'DELETE' }), 'Interview removed');

export const useCreateTask = () =>
  useDataMutation(({ applicationId, ...body }: Partial<Task> & { applicationId: string }) => api<Task>(`/applications/${applicationId}/tasks`, { method: 'POST', body }), 'Task added');
export const useUpdateTask = () => useDataMutation(({ id, ...body }: Partial<Task> & { id: string }) => api<Task>(`/tasks/${id}`, { method: 'PATCH', body }), 'Task updated');
export const useDeleteTask = () => useDataMutation((id: string) => api(`/tasks/${id}`, { method: 'DELETE' }), 'Task removed');

export function useSavePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<FilterPreset, 'id'>) => api<FilterPreset>('/presets', { method: 'POST', body }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['presets'] });
      toast.success(`Preset “${p.name}” saved`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/presets/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presets'] }),
  });
}

export function useSaveLayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sections: { id: string; visible: boolean }[]) => api('/me/dashboard-layout', { method: 'PUT', body: { sections } }),
    onMutate: (sections) => {
      qc.setQueryData<Me>(['me'], (m) => (m ? { ...m, dashboardLayout: sections } : m));
    },
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
