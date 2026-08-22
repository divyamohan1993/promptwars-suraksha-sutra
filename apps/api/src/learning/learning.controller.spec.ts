import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module';
import { traceIdMiddleware } from '../http/trace-id.middleware';
import { SafeExceptionFilter } from '../http/safe-exception.filter';

describe('P0 learning API', () => {
  let application: INestApplication | undefined;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['ENABLE_EVALUATOR_CONTROLS'] = 'true';
    process.env['EVALUATOR_UID'] = 'evaluator';
  });

  afterEach(async () => {
    await application?.close();
    application = undefined;
  });

  async function createApplication(): Promise<INestApplication> {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const created = module.createNestApplication();
    created.setGlobalPrefix('api/v1');
    created.use(traceIdMiddleware);
    created.useGlobalFilters(new SafeExceptionFilter());
    await created.init();
    application = created;
    return created;
  }

  it('rejects missing Firebase bearer tokens', async () => {
    const app = await createApplication();
    const response = await request(app.getHttpServer()).post('/api/v1/session/bootstrap').send({});
    expect(response.status).toBe(401);
  });

  it('seeds exactly three profiles and preserves isolated state', async () => {
    const app = await createApplication();
    const bootstrap = await request(app.getHttpServer())
      .post('/api/v1/session/bootstrap')
      .set('authorization', 'Bearer test:evaluator')
      .send({});
    expect(bootstrap.status).toBe(201);
    expect(bootstrap.body.profiles).toHaveLength(3);
    expect(bootstrap.body.selectedProfileId).toBe('profile-savita');

    const diagnostic = await request(app.getHttpServer())
      .post('/api/v1/profiles/profile-savita/diagnostic')
      .set('authorization', 'Bearer test:evaluator')
      .send({ choiceId: 'wrong-payment', confidence: 0.95, responseTimeMs: 900 });
    expect(diagnostic.status).toBe(201);
    expect(diagnostic.body.assessment.quadrant).toBe('incorrect_confident');
    expect(diagnostic.body.misconception.severityBand).toBe('high');

    const other = await request(app.getHttpServer())
      .get('/api/v1/profiles/profile-arjun/dashboard')
      .set('authorization', 'Bearer test:evaluator');
    expect(other.status).toBe(200);
    expect(
      other.body.states.find(
        (state: { conceptId: string }) => state.conceptId === 'money_in_vs_money_out',
      ).status,
    ).toBe('unassessed');
  });

  it('uses an explicitly labelled fallback for evaluator failure injection', async () => {
    const app = await createApplication();
    await request(app.getHttpServer())
      .post('/api/v1/session/bootstrap')
      .set('authorization', 'Bearer test:evaluator')
      .send({});
    const response = await request(app.getHttpServer())
      .post('/api/v1/profiles/profile-savita/explanation')
      .set('authorization', 'Bearer test:evaluator')
      .send({ forceFailure: true });
    expect(response.status).toBe(201);
    expect(response.body.lesson.generationMode).toBe('curated_fallback');
    expect(response.body.fallbackLabel).toMatch(/Curated fallback used/);
    expect(response.body.evidence.modelCallSucceeded).toBe(false);
  });

  it('rejects invalid teach-back input without persisting raw text', async () => {
    const app = await createApplication();
    await request(app.getHttpServer())
      .post('/api/v1/session/bootstrap')
      .set('authorization', 'Bearer test:evaluator')
      .send({});
    const response = await request(app.getHttpServer())
      .post('/api/v1/profiles/profile-savita/teach-back')
      .set('authorization', 'Bearer test:evaluator')
      .send({ text: '' });
    expect(response.status).toBe(400);
  });
});
