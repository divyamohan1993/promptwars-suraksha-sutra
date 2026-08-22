import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { getRuntimeEnvironment, type RuntimeEnvironment } from './runtime-environment';

@Controller('config')
export class RuntimeConfigController {
  public constructor(
    @Inject(ConfigService) private readonly config: ConfigService<RuntimeEnvironment>,
  ) {}

  @Get()
  public getConfig(): unknown {
    const environment = getRuntimeEnvironment(this.config);
    return {
      app: {
        name: 'SurakshaSutra',
        version: '0.1.0',
        environment: environment.NODE_ENV === 'test' ? 'development' : environment.NODE_ENV,
      },
      apiBaseUrl: environment.API_BASE_URL,
      supportedLanguages: ['hi', 'en', 'hinglish', 'hi_en'],
      firebase: {
        apiKey: environment.FIREBASE_API_KEY,
        authDomain: environment.FIREBASE_AUTH_DOMAIN,
        projectId: environment.FIREBASE_PROJECT_ID,
        appId: environment.FIREBASE_APP_ID,
        messagingSenderId: environment.FIREBASE_MESSAGING_SENDER_ID,
        storageBucket: environment.FIREBASE_STORAGE_BUCKET,
        googleProviderId: environment.FIREBASE_GOOGLE_PROVIDER_ID,
        googleClientId: environment.FIREBASE_GOOGLE_CLIENT_ID,
      },
      model: {
        provider: 'vertex-ai',
        modelId: environment.VERTEX_MODEL_ID,
        location: environment.VERTEX_LOCATION,
        maxOutputTokens: environment.VERTEX_MAX_OUTPUT_TOKENS,
        timeoutMs: environment.VERTEX_TIMEOUT_MS,
      },
      featureFlags: {
        adaptiveExplanation: true,
        teachBackAnalysis: true,
        simulator: true,
        evaluatorControls: environment.ENABLE_EVALUATOR_CONTROLS,
      },
    };
  }
}
