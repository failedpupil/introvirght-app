import { API_BASE_URL } from './config';
import { FeelId } from '../data/content';

export interface EchoItem {
  id: string;
  feel: FeelId;
  text: string;
  /** The writer's chosen display name — the only thing shown about another user. Null on
   * echoes written before names existed; the card falls back rather than inventing one. */
  name: string | null;
  createdAtMs: number;
  felt: number;
  feltByMe: boolean;
  mine: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, 'Network unreachable');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function googleAuth(idToken: string): Promise<{ token: string; created: boolean }> {
  return request('/v1/auth/google', { method: 'POST', body: JSON.stringify({ id_token: idToken }) });
}

export function signOutRequest(token: string): Promise<{ ok: boolean }> {
  return request('/v1/auth/signout', { method: 'POST', headers: authHeader(token) });
}

export function fetchEchoes(
  params: { feeling?: FeelId; since?: number; cursor?: number },
  token?: string | null
): Promise<{ items: EchoItem[] }> {
  const q = new URLSearchParams();
  if (params.feeling) q.set('feeling', params.feeling);
  if (params.since) q.set('since', String(params.since));
  if (params.cursor) q.set('cursor', String(params.cursor));
  const qs = q.toString();
  return request(`/v1/echoes${qs ? `?${qs}` : ''}`, {
    headers: token ? authHeader(token) : undefined,
  });
}

export function postEchoRequest(feeling: FeelId, text: string, name: string, token: string): Promise<EchoItem> {
  return request('/v1/echoes', {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ feeling, text, name }),
  });
}

/** Renames this user's echoes. See the server route for why older ones may keep the old name. */
export function renameEchoesRequest(name: string, token: string): Promise<{ ok: boolean; renamed: number }> {
  return request('/v1/echoes/name', {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ name }),
  });
}

export function feltEchoRequest(id: string, token: string): Promise<{ felt: number; feltByMe: boolean }> {
  return request(`/v1/echoes/${id}/felt`, { method: 'POST', headers: authHeader(token) });
}

/** Erases the Echoes account and every unexpired echo written under it. Irreversible. */
export function deleteAccountRequest(token: string): Promise<{ ok: boolean; echoes: number }> {
  return request('/v1/account/delete', { method: 'POST', headers: authHeader(token) });
}

export function fetchStats(): Promise<{ peopleTotal: number }> {
  return request('/v1/echoes/stats');
}
