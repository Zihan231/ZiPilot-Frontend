import { auth } from './firebase';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const tz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

async function headers(json = true): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken();
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'X-Timezone': tz(),
  };
}

export type QueryInput = string | URLSearchParams | Record<string, string | number | boolean | undefined | null>;

export function toQueryString(q?: QueryInput): string {
  if (!q) return '';
  if (typeof q === 'string') return q.replace(/^\?/, '');
  if (q instanceof URLSearchParams) return q.toString();
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  return p.toString();
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; query?: QueryInput } = {}): Promise<T> {
  const qs = toQueryString(opts.query);
  const res = await fetch(`${API_URL}${path}${qs ? `?${qs}` : ''}`, {
    method: opts.method ?? 'GET',
    headers: await headers(),
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? message);
    } catch {}
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Downloads a server-generated file (CSV export) with auth headers. */
export async function download(path: string, query?: QueryInput) {
  const qs = toQueryString(query);
  const res = await fetch(`${API_URL}${path}${qs ? `?${qs}` : ''}`, { headers: await headers(false) });
  if (!res.ok) throw new ApiError(res.status, 'Export failed');
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'export.csv';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
