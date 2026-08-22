export type RuntimeMode = 'development' | 'test' | 'production';

import type { ConfigService } from '@nestjs/config';

export interface RuntimeEnvironment {
  readonly NODE_ENV: RuntimeMode;
  readonly PORT: number;
  readonly API_PREFIX: string;
  readonly CORS_ORIGINS: readonly string[];
  readonly REQUEST_BODY_LIMIT: string;
  readonly API_BASE_URL: string;
  readonly GCP_PROJECT_ID: string;
  readonly GCP_RUNTIME_API_KEY: string;
  readonly GCP_RUNTIME_CREDENTIALS_BASE64: string;
  readonly FIRESTORE_DATABASE_ID: string;
  readonly VERTEX_LOCATION: string;
  readonly VERTEX_MODEL_ID: string;
  readonly VERTEX_TIMEOUT_MS: number;
  readonly VERTEX_MAX_INPUT_CHARS: number;
  readonly VERTEX_MAX_OUTPUT_TOKENS: number;
  readonly PROMPT_TEMPLATE_VERSION: string;
  readonly FORMULA_VERSION: string;
  readonly FIREBASE_API_KEY: string;
  readonly FIREBASE_AUTH_DOMAIN: string;
  readonly FIREBASE_PROJECT_ID: string;
  readonly FIREBASE_APP_ID: string;
  readonly FIREBASE_MESSAGING_SENDER_ID: string;
  readonly FIREBASE_STORAGE_BUCKET: string;
  readonly FIREBASE_GOOGLE_PROVIDER_ID: string;
  readonly FIREBASE_GOOGLE_CLIENT_ID: string;
  readonly EVALUATOR_UID: string;
  readonly ENABLE_EVALUATOR_CONTROLS: boolean;
  readonly TEST_AUTH_MODE: boolean;
  readonly RATE_LIMIT_STATE_PER_MINUTE: number;
}

export function getRuntimeEnvironment(
  config: ConfigService<RuntimeEnvironment>,
): RuntimeEnvironment {
  return {
    NODE_ENV: config.getOrThrow<RuntimeEnvironment['NODE_ENV']>('NODE_ENV'),
    PORT: config.getOrThrow<number>('PORT'),
    API_PREFIX: config.getOrThrow<string>('API_PREFIX'),
    CORS_ORIGINS: config.getOrThrow<readonly string[]>('CORS_ORIGINS'),
    REQUEST_BODY_LIMIT: config.getOrThrow<string>('REQUEST_BODY_LIMIT'),
    API_BASE_URL: config.get<string>('API_BASE_URL') ?? '/api/v1',
    GCP_PROJECT_ID: config.get<string>('GCP_PROJECT_ID') ?? '',
    GCP_RUNTIME_API_KEY: config.get<string>('GCP_RUNTIME_API_KEY') ?? '',
    GCP_RUNTIME_CREDENTIALS_BASE64: config.get<string>('GCP_RUNTIME_CREDENTIALS_BASE64') ?? '',
    FIRESTORE_DATABASE_ID: config.get<string>('FIRESTORE_DATABASE_ID') ?? '(default)',
    VERTEX_LOCATION: config.get<string>('VERTEX_LOCATION') ?? 'global',
    VERTEX_MODEL_ID: config.get<string>('VERTEX_MODEL_ID') ?? 'gemini-3.5-flash-lite',
    VERTEX_TIMEOUT_MS: config.get<number>('VERTEX_TIMEOUT_MS') ?? 12_000,
    VERTEX_MAX_INPUT_CHARS: config.get<number>('VERTEX_MAX_INPUT_CHARS') ?? 2_000,
    VERTEX_MAX_OUTPUT_TOKENS: config.get<number>('VERTEX_MAX_OUTPUT_TOKENS') ?? 1_200,
    PROMPT_TEMPLATE_VERSION: config.get<string>('PROMPT_TEMPLATE_VERSION') ?? 'prompt-v1',
    FORMULA_VERSION: config.get<string>('FORMULA_VERSION') ?? 'adaptive-policy-v1',
    FIREBASE_API_KEY: config.get<string>('FIREBASE_API_KEY') ?? '',
    FIREBASE_AUTH_DOMAIN: config.get<string>('FIREBASE_AUTH_DOMAIN') ?? '',
    FIREBASE_PROJECT_ID: config.get<string>('FIREBASE_PROJECT_ID') ?? '',
    FIREBASE_APP_ID: config.get<string>('FIREBASE_APP_ID') ?? '',
    FIREBASE_MESSAGING_SENDER_ID: config.get<string>('FIREBASE_MESSAGING_SENDER_ID') ?? '',
    FIREBASE_STORAGE_BUCKET: config.get<string>('FIREBASE_STORAGE_BUCKET') ?? '',
    FIREBASE_GOOGLE_PROVIDER_ID: config.get<string>('FIREBASE_GOOGLE_PROVIDER_ID') ?? 'google.com',
    FIREBASE_GOOGLE_CLIENT_ID: config.get<string>('FIREBASE_GOOGLE_CLIENT_ID') ?? '',
    EVALUATOR_UID: config.get<string>('EVALUATOR_UID') ?? '',
    ENABLE_EVALUATOR_CONTROLS: config.get<boolean>('ENABLE_EVALUATOR_CONTROLS') ?? false,
    TEST_AUTH_MODE: config.get<boolean>('TEST_AUTH_MODE') ?? false,
    RATE_LIMIT_STATE_PER_MINUTE: config.get<number>('RATE_LIMIT_STATE_PER_MINUTE') ?? 60,
  };
}

const runtimeModes: readonly RuntimeMode[] = ['development', 'test', 'production'];
const defaultPort = 3000;
const defaultApiPrefix = 'api/v1';
const defaultRequestBodyLimit = '128kb';
const localDevelopmentOrigin = 'http://localhost:4200';

function readString(
  environment: Record<string, string | undefined>,
  key: string,
  fallback = '',
): string {
  const value = environment[key]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function readInteger(
  environment: Record<string, string | undefined>,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = readString(environment, key);
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

function readBoolean(
  environment: Record<string, string | undefined>,
  key: string,
  fallback: boolean,
): boolean {
  const value = readString(environment, key);
  if (!value) return fallback;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  throw new Error(`${key} must be true or false.`);
}

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
    API_BASE_URL: readString(environment, 'API_BASE_URL', '/api/v1'),
    GCP_PROJECT_ID: readString(environment, 'GCP_PROJECT_ID'),
    GCP_RUNTIME_API_KEY: readString(environment, 'GCP_RUNTIME_API_KEY'),
    GCP_RUNTIME_CREDENTIALS_BASE64: readString(environment, 'GCP_RUNTIME_CREDENTIALS_BASE64'),
    FIRESTORE_DATABASE_ID: readString(environment, 'FIRESTORE_DATABASE_ID', '(default)'),
    VERTEX_LOCATION: readString(environment, 'VERTEX_LOCATION', 'global'),
    VERTEX_MODEL_ID: readString(environment, 'VERTEX_MODEL_ID', 'gemini-3.5-flash-lite'),
    VERTEX_TIMEOUT_MS: readInteger(environment, 'VERTEX_TIMEOUT_MS', 12_000, 1_000, 12_000),
    VERTEX_MAX_INPUT_CHARS: readInteger(environment, 'VERTEX_MAX_INPUT_CHARS', 2_000, 1, 2_000),
    VERTEX_MAX_OUTPUT_TOKENS: readInteger(
      environment,
      'VERTEX_MAX_OUTPUT_TOKENS',
      1_200,
      1,
      32_000,
    ),
    PROMPT_TEMPLATE_VERSION: readString(environment, 'PROMPT_TEMPLATE_VERSION', 'prompt-v1'),
    FORMULA_VERSION: readString(environment, 'FORMULA_VERSION', 'adaptive-policy-v1'),
    FIREBASE_API_KEY: readString(environment, 'FIREBASE_API_KEY'),
    FIREBASE_AUTH_DOMAIN: readString(environment, 'FIREBASE_AUTH_DOMAIN'),
    FIREBASE_PROJECT_ID: readString(environment, 'FIREBASE_PROJECT_ID'),
    FIREBASE_APP_ID: readString(environment, 'FIREBASE_APP_ID'),
    FIREBASE_MESSAGING_SENDER_ID: readString(environment, 'FIREBASE_MESSAGING_SENDER_ID'),
    FIREBASE_STORAGE_BUCKET: readString(environment, 'FIREBASE_STORAGE_BUCKET'),
    FIREBASE_GOOGLE_PROVIDER_ID: readString(
      environment,
      'FIREBASE_GOOGLE_PROVIDER_ID',
      'google.com',
    ),
    FIREBASE_GOOGLE_CLIENT_ID: readString(environment, 'FIREBASE_GOOGLE_CLIENT_ID'),
    EVALUATOR_UID: readString(environment, 'EVALUATOR_UID'),
    ENABLE_EVALUATOR_CONTROLS: readBoolean(environment, 'ENABLE_EVALUATOR_CONTROLS', false),
    TEST_AUTH_MODE: readBoolean(environment, 'TEST_AUTH_MODE', mode === 'test'),
    RATE_LIMIT_STATE_PER_MINUTE: readInteger(
      environment,
      'RATE_LIMIT_STATE_PER_MINUTE',
      60,
      1,
      600,
    ),
  };
}
