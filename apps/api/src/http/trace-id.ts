import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

export interface TraceableRequest extends Request {
  traceId?: string;
}

const traceIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

export function resolveTraceId(header: string | string[] | undefined): string {
  const candidate = Array.isArray(header) ? header[0] : header;
  return candidate !== undefined && traceIdPattern.test(candidate) ? candidate : randomUUID();
}
