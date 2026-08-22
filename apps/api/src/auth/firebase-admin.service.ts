import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

import { getRuntimeEnvironment, type RuntimeEnvironment } from '../config/runtime-environment';
import type { AuthenticatedUser } from './auth.types';

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private readonly environment: RuntimeEnvironment;
  private readonly app?: App;
  private readonly auth?: Auth;
  private readonly firestore?: Firestore;

  public constructor(@Inject(ConfigService) config: ConfigService<RuntimeEnvironment>) {
    this.environment = getRuntimeEnvironment(config);
    const credentials = this.environment.GCP_RUNTIME_CREDENTIALS_BASE64;
    const projectId = this.environment.GCP_PROJECT_ID || this.environment.FIREBASE_PROJECT_ID;

    if (credentials && projectId) {
      try {
        const serviceAccount = JSON.parse(Buffer.from(credentials, 'base64').toString('utf8')) as {
          readonly client_email?: string;
          readonly private_key?: string;
          readonly project_id?: string;
        };
        if (!serviceAccount.client_email || !serviceAccount.private_key) {
          throw new Error('Runtime service account is missing client_email or private_key.');
        }
        const existing = getApps().find((candidate) => candidate.name === 'suraksha-sutra');
        this.app =
          existing ??
          initializeApp(
            {
              credential: cert({
                projectId: serviceAccount.project_id ?? projectId,
                clientEmail: serviceAccount.client_email,
                privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
              }),
              projectId,
            },
            'suraksha-sutra',
          );
        this.auth = getAuth(this.app);
        this.firestore = getFirestore(this.app, this.environment.FIRESTORE_DATABASE_ID);
      } catch (error: unknown) {
        this.logger.error(`Firebase Admin initialization failed: ${safeErrorMessage(error)}`);
      }
    }
  }

  public getFirestore(): Firestore | undefined {
    return this.firestore;
  }

  public async verifyBearerToken(token: string): Promise<AuthenticatedUser> {
    if (this.environment.TEST_AUTH_MODE && token.startsWith('test:')) {
      const uid = token.slice('test:'.length).trim();
      if (!uid || uid.length > 128) throw new UnauthorizedException('Invalid test token.');
      return {
        uid,
        claims: { evaluator: uid === this.environment.EVALUATOR_UID },
        isEvaluator: uid === this.environment.EVALUATOR_UID,
      };
    }

    if (!this.auth) {
      throw new UnauthorizedException('Authentication is not configured.');
    }

    try {
      const decoded = await this.auth.verifyIdToken(token, true);
      return toAuthenticatedUser(decoded, this.environment.EVALUATOR_UID);
    } catch {
      throw new UnauthorizedException('The authentication token is invalid or expired.');
    }
  }
}

function toAuthenticatedUser(decoded: DecodedIdToken, evaluatorUid: string): AuthenticatedUser {
  const claims: Record<string, unknown> = { ...decoded };
  const isEvaluator =
    decoded.uid === evaluatorUid ||
    decoded['evaluator'] === true ||
    (Array.isArray(decoded['roles']) && decoded['roles'].includes('evaluator'));
  return {
    uid: decoded.uid,
    email: typeof decoded.email === 'string' ? decoded.email : undefined,
    claims,
    isEvaluator,
  };
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 240) : 'unknown error';
}
