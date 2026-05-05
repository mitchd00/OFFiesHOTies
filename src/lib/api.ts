import type { Cluster } from './suburbs';
import type { Offie, Hotie, RecycleBinEntry } from './types';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function agentHeader(): Record<string, string> {
  const id = localStorage.getItem('offies-hoties:agent-id');
  return id ? { 'X-Agent-Id': id } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...agentHeader(),
    ...((init.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(path, { ...init, headers, credentials: 'include' });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = (body && typeof body === 'object' && 'error' in body) ? String(body.error) : res.statusText;
    throw new ApiError(res.status, msg);
  }
  return body as T;
}

export const api = {
  pin: {
    submit: (pin: string) => request<{ ok: true }>('/api/pin', { method: 'POST', body: JSON.stringify({ pin }) }),
    check: () => request<{ ok: boolean }>('/api/pin/check'),
  },
  offies: {
    list: (cluster: Cluster) => request<Offie[]>(`/api/offies?cluster=${cluster}`),
    create: (input: OffieCreateInput) => request<Offie>('/api/offies', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: OffieUpdateInput) =>
      request<Offie>(`/api/offies/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    refresh: (id: string) => request<Offie>(`/api/offies/${id}`, { method: 'PATCH', body: JSON.stringify({ refresh: true }) }),
    remove: (id: string) => request<void>(`/api/offies/${id}`, { method: 'DELETE' }),
  },
  hoties: {
    list: (cluster: Cluster) => request<Hotie[]>(`/api/hoties?cluster=${cluster}`),
    create: (input: HotieCreateInput) => request<Hotie>('/api/hoties', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: HotieUpdateInput) =>
      request<Hotie>(`/api/hoties/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    refresh: (id: string) => request<Hotie>(`/api/hoties/${id}`, { method: 'PATCH', body: JSON.stringify({ refresh: true }) }),
    remove: (id: string) => request<void>(`/api/hoties/${id}`, { method: 'DELETE' }),
  },
  recycleBin: {
    list: () => request<RecycleBinEntry[]>('/api/recycle-bin'),
    restore: (type: 'offie' | 'hotie', id: string) =>
      request<void>(`/api/recycle-bin/${type}/${id}/restore`, { method: 'POST' }),
    purge: (type: 'offie' | 'hotie', id: string) =>
      request<void>(`/api/recycle-bin/${type}/${id}`, { method: 'DELETE' }),
  },
};

export interface OffieCreateInput {
  property: { street: string; suburb: string; postcode: string; lat: number | null; lng: number | null };
  price_guide: string;
  situation: string;
  notes: string;
  agent_id: string;
}

export interface OffieUpdateInput {
  property?: { street: string; suburb: string; postcode: string; lat: number | null; lng: number | null };
  price_guide?: string;
  situation?: string;
  notes?: string;
  agent_id?: string;
  refresh?: boolean;
}

export interface HotieCreateInput {
  buyer_name: string;
  suburb_focus: string[];
  budget_band: string;
  brief: string;
  agent_id: string;
}

export interface HotieUpdateInput {
  buyer_name?: string;
  suburb_focus?: string[];
  budget_band?: string;
  brief?: string;
  agent_id?: string;
  refresh?: boolean;
}

export { ApiError };
