import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { RuntimeEnvironment } from '../config/runtime-environment';
import type { HealthResponse, ReadinessResponse } from './health.types';

@Injectable()
export class HealthService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService<RuntimeEnvironment>,
  ) {}

  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(3)),
    };
  }

  getReadiness(): ReadinessResponse {
    const configurationReady =
      this.configService.get<RuntimeEnvironment['NODE_ENV']>('NODE_ENV') !== undefined;
    const configurationStatus = configurationReady ? 'ready' : 'not_ready';

    return {
      status: configurationReady ? 'ready' : 'not_ready',
      checks: {
        configuration: configurationStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
