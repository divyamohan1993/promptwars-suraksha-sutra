export interface HealthResponse {
  readonly status: 'ok';
  readonly service: 'api';
  readonly timestamp: string;
  readonly uptimeSeconds: number;
}

export interface ReadinessResponse {
  readonly status: 'ready' | 'not_ready';
  readonly checks: {
    readonly configuration: 'ready' | 'not_ready';
  };
  readonly timestamp: string;
}
