import { inject, Injectable } from '@angular/core';

import { AuthService, type PublicRuntimeConfig } from './auth.service';

export type RequestOptions = {
  readonly method?: 'GET' | 'POST' | 'PUT';
  readonly body?: unknown;
  readonly auth?: boolean;
  readonly query?: Record<string, string | number | boolean | null | undefined>;
};

export type ApiFailure = Error & {
  readonly code?: string;
  readonly traceId?: string;
  readonly status?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const unwrap = (value: unknown): unknown => {
  if (isRecord(value) && 'data' in value) return value.data;
  return value;
};

const asApiFailure = (body: unknown, status: number): ApiFailure => {
  const envelope = isRecord(body) && isRecord(body.error) ? body.error : body;
  const message =
    (isRecord(envelope) && typeof envelope.message === 'string' && envelope.message) ||
    (status === 401
      ? 'Your session expired. Please sign in again.'
      : 'The service could not complete that step.');
  const error = new Error(message) as ApiFailure;
  Object.defineProperties(error, {
    code: {
      value: isRecord(envelope) && typeof envelope.code === 'string' ? envelope.code : undefined,
    },
    traceId: {
      value:
        isRecord(envelope) && typeof envelope.traceId === 'string' ? envelope.traceId : undefined,
    },
    status: { value: status },
  });
  return error;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private runtimeConfig: PublicRuntimeConfig | null = null;
  private readonly auth = inject(AuthService);

  setRuntimeConfig(config: PublicRuntimeConfig): void {
    this.runtimeConfig = config;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const config = this.runtimeConfig ?? this.auth.config();
    if (!config) throw new Error('The public runtime configuration is not ready.');
    const base = config.apiBaseUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${base}${normalizedPath}`, window.location.origin);
    Object.entries(options.query ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && String(value).length > 0) {
        url.searchParams.set(key, String(value));
      }
    });
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.auth !== false) headers.Authorization = `Bearer ${await this.auth.idToken()}`;
    const response = await fetch(url.toString(), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) throw asApiFailure(body, response.status);
    return unwrap(body) as T;
  }

  async bootstrap(): Promise<unknown> {
    return this.request('/session/bootstrap', { method: 'POST', body: {} });
  }

  async getProfile(profileId: string): Promise<unknown> {
    return this.request('/profile', { query: { profileId } });
  }

  async updateConstitution(profileId: string, constitution: unknown): Promise<unknown> {
    return this.request('/constitution', { method: 'PUT', body: { profileId, constitution } });
  }

  async submitDiagnostic(payload: unknown): Promise<unknown> {
    return this.request('/diagnostic', { method: 'POST', body: payload });
  }

  async getExplanation(payload: unknown): Promise<unknown> {
    return this.request('/explanation', { method: 'POST', body: payload });
  }

  async getScenario(payload: unknown): Promise<unknown> {
    return this.request('/scenario', { method: 'POST', body: payload });
  }

  async submitTeachBack(payload: unknown): Promise<unknown> {
    return this.request('/teach-back', { method: 'POST', body: payload });
  }

  async getDashboard(profileId?: string): Promise<unknown> {
    return this.request('/dashboard', { query: profileId ? { profileId } : undefined });
  }

  async resetEvaluator(): Promise<unknown> {
    return this.request('/evaluator/reset', { method: 'POST', body: {} });
  }
}
