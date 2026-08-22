import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module';
import { traceIdMiddleware } from '../http/trace-id.middleware';

describe('health API', () => {
  let application: INestApplication | undefined;

  afterEach(async () => {
    await application?.close();
  });

  it('reports health with a trace id', async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    application = configureTestApplication(module.createNestApplication());
    await application.init();

    const response = await request(application.getHttpServer())
      .get('/api/v1/health')
      .set('x-trace-id', 'health-test-1');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'api' });
    expect(response.body.timestamp).toEqual(expect.any(String));
    expect(response.headers['x-trace-id']).toBe('health-test-1');
  });

  it('reports configuration readiness', async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    application = configureTestApplication(module.createNestApplication());
    await application.init();

    const response = await request(application.getHttpServer()).get('/api/v1/ready');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ready',
      checks: { configuration: 'ready' },
    });
  });
});

function configureTestApplication(testApplication: INestApplication): INestApplication {
  testApplication.setGlobalPrefix('api/v1');
  testApplication.use(traceIdMiddleware);
  return testApplication;
}
