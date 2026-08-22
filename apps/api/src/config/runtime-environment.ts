export type RuntimeMode = 'development' | 'test' | 'production';

export interface RuntimeEnvironment {
  readonly NODE_ENV: RuntimeMode;
  readonly PORT: number;
  readonly API_PREFIX: string;
  readonly CORS_ORIGINS: readonly string[];
  readonly REQUEST_BODY_LIMIT: string;
}

const runtimeModes: readonly RuntimeMode[] = ['development', 'test', 'production'];
const defaultPort = 3000;
const defaultApiPrefix = 'api/v1';
const defaultRequestBodyLimit = '128kb';
const localDevelopmentOrigin = 'http://localhost:4200';

function parseRuntimeMode(value: string | undefined): RuntimeMode {
  if (value !== undefined && runtimeModes.includes(value as RuntimeMode)) {
    return value as RuntimeMode;
  }

  return 'development';
}

function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return defaultPort;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function parseApiPrefix(value: string | undefined): string {
  const prefix = value?.trim().replace(/^\/+|\/+$/g, '') ?? defaultApiPrefix;
  if (prefix.length === 0 || prefix.includes(' ')) {
    throw new Error('API_PREFIX must be a non-empty path segment.');
  }

  return prefix;
}

function parseCorsOrigins(value: string | undefined, mode: RuntimeMode): readonly string[] {
  const configuredOrigins = value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  const origins =
    configuredOrigins && configuredOrigins.length > 0
      ? configuredOrigins
      : mode === 'production'
        ? []
        : [localDevelopmentOrigin];

  if (origins.some((origin) => origin === '*' || !isHttpOrigin(origin))) {
    throw new Error('CORS_ORIGINS must contain explicit HTTP(S) origins and cannot use *.');
  }

  if (mode === 'production' && origins.length === 0) {
    throw new Error('CORS_ORIGINS must be configured in production.');
  }

  return origins;
}

function isHttpOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.pathname === '/' &&
      url.search === '' &&
      url.hash === ''
    );
  } catch {
    return false;
  }
}

export function validateRuntimeEnvironment(
  environment: Record<string, string | undefined>,
): RuntimeEnvironment {
  const mode = parseRuntimeMode(environment['NODE_ENV']);

  return {
    NODE_ENV: mode,
    PORT: parsePort(environment['PORT']),
    API_PREFIX: parseApiPrefix(environment['API_PREFIX']),
    CORS_ORIGINS: parseCorsOrigins(environment['CORS_ORIGINS'], mode),
    REQUEST_BODY_LIMIT: environment['REQUEST_BODY_LIMIT']?.trim() || defaultRequestBodyLimit,
  };
}
