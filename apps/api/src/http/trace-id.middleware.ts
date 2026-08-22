import type { NextFunction, Response } from 'express';
import type { Request } from 'express';

import { resolveTraceId, type TraceableRequest } from './trace-id';

export function traceIdMiddleware(request: Request, response: Response, next: NextFunction): void {
  const traceableRequest = request as TraceableRequest;
  const traceId = resolveTraceId(request.headers['x-trace-id']);
  traceableRequest.traceId = traceId;
  response.setHeader('x-trace-id', traceId);
  next();
}
