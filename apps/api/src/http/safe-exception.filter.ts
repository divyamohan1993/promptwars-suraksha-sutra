import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

import type { TraceableRequest } from './trace-id';

export interface ApiErrorEnvelope {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly message: string;
  readonly traceId: string;
  readonly timestamp: string;
  readonly path: string;
}

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<TraceableRequest>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : isZodError(exception)
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;
    const traceId = request.traceId ?? 'unavailable';
    const envelope: ApiErrorEnvelope = {
      statusCode,
      errorCode: statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
      message:
        statusCode >= 500
          ? 'The request could not be completed.'
          : isZodError(exception)
            ? 'The request payload is invalid.'
            : getClientMessage(exception),
      traceId,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    };

    response.status(statusCode).json(envelope);
  }
}

function isZodError(value: unknown): value is { readonly issues: readonly unknown[] } {
  return Boolean(
    value &&
    typeof value === 'object' &&
    (value as { readonly name?: unknown }).name === 'ZodError' &&
    Array.isArray((value as { readonly issues?: unknown }).issues),
  );
}

function getClientMessage(exception: HttpException | unknown): string {
  if (!(exception instanceof HttpException)) {
    return 'The request is invalid.';
  }

  const response = exception.getResponse();
  if (typeof response === 'string') {
    return response;
  }

  if (isMessageRecord(response)) {
    const message = response.message;
    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(', ');
    }
  }

  return 'The request is invalid.';
}

function isMessageRecord(value: object): value is { readonly message?: unknown } {
  return 'message' in value;
}
