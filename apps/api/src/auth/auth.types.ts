import type { TraceableRequest } from '../http/trace-id';

export interface AuthenticatedUser {
  readonly uid: string;
  readonly email?: string;
  readonly claims: Readonly<Record<string, unknown>>;
  readonly isEvaluator: boolean;
}

export interface AuthenticatedRequest extends TraceableRequest {
  authUser?: AuthenticatedUser;
}

export function requireAuthenticatedUser(request: AuthenticatedRequest): AuthenticatedUser {
  if (!request.authUser) {
    throw new Error('Authenticated user was not attached to the request.');
  }
  return request.authUser;
}
