import { Controller, Get, Inject } from '@nestjs/common';

import type { HealthResponse, ReadinessResponse } from './health.types';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get('health')
  health(): HealthResponse {
    return this.healthService.getHealth();
  }

  @Get('ready')
  ready(): ReadinessResponse {
    return this.healthService.getReadiness();
  }
}
