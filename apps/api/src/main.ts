import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { json } from 'express';

import { AppModule } from './app.module';
import type { RuntimeEnvironment } from './config/runtime-environment';
import { SafeExceptionFilter } from './http/safe-exception.filter';
import { traceIdMiddleware } from './http/trace-id.middleware';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService<RuntimeEnvironment>);
  const environment: RuntimeEnvironment = {
    NODE_ENV: configService.getOrThrow<RuntimeEnvironment['NODE_ENV']>('NODE_ENV'),
    PORT: configService.getOrThrow<number>('PORT'),
    API_PREFIX: configService.getOrThrow<string>('API_PREFIX'),
    CORS_ORIGINS: configService.getOrThrow<readonly string[]>('CORS_ORIGINS'),
    REQUEST_BODY_LIMIT: configService.getOrThrow<string>('REQUEST_BODY_LIMIT'),
  };

  app.use(traceIdMiddleware);
  app.use(helmet());
  app.use(json({ limit: environment.REQUEST_BODY_LIMIT }));
  app.enableCors({
    credentials: true,
    origin: [...environment.CORS_ORIGINS],
  });
  app.setGlobalPrefix(environment.API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new SafeExceptionFilter());

  await app.listen(environment.PORT, '0.0.0.0');
}

void bootstrap().catch((error: unknown) => {
  process.stderr.write(`API failed to start: ${String(error)}\n`);
  process.exitCode = 1;
});
