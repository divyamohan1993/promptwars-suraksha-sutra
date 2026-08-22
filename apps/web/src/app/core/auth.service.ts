import { Injectable, signal } from '@angular/core';
import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';

export type PublicRuntimeConfig = {
  readonly apiBaseUrl: string;
  readonly firebase: FirebaseOptions;
  readonly environment?: string;
  readonly appVersion?: string;
  readonly model?: {
    readonly provider?: string;
    readonly modelId?: string;
    readonly location?: string;
  };
  readonly featureFlags?: Record<string, boolean>;
};

const requiredFirebaseKeys = ['apiKey', 'appId', 'projectId'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const unwrap = (value: unknown): unknown => {
  if (isRecord(value) && 'data' in value && isRecord(value.data)) {
    return value.data;
  }
  return value;
};

const readFirebaseOptions = (value: unknown): FirebaseOptions | null => {
  if (!isRecord(value)) return null;
  const nested =
    (isRecord(value.firebase) && value.firebase) ||
    (isRecord(value.firebaseConfig) && value.firebaseConfig) ||
    (isRecord(value.config) && isRecord(value.config.firebase) && value.config.firebase) ||
    value;
  if (!isRecord(nested)) return null;
  const hasRequired = requiredFirebaseKeys.every((key) => typeof nested[key] === 'string');
  if (!hasRequired) return null;
  return {
    apiKey: nested.apiKey as string,
    appId: nested.appId as string,
    projectId: nested.projectId as string,
    authDomain: typeof nested.authDomain === 'string' ? nested.authDomain : undefined,
    storageBucket: typeof nested.storageBucket === 'string' ? nested.storageBucket : undefined,
    messagingSenderId:
      typeof nested.messagingSenderId === 'string' ? nested.messagingSenderId : undefined,
  };
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null);
  readonly config = signal<PublicRuntimeConfig | null>(null);
  readonly configState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly configError = signal('');

  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private configPromise: Promise<PublicRuntimeConfig> | null = null;

  async loadConfig(): Promise<PublicRuntimeConfig> {
    if (this.config()) return this.config() as PublicRuntimeConfig;
    if (this.configPromise) return this.configPromise;
    this.configPromise = fetch('/api/v1/config', {
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error('Public runtime configuration is unavailable.');
        }
        const payload = unwrap(body);
        const options = readFirebaseOptions(payload);
        if (!options) {
          throw new Error('The public Firebase configuration is incomplete.');
        }
        const record = isRecord(payload) ? payload : {};
        const runtimeConfig: PublicRuntimeConfig = {
          apiBaseUrl:
            typeof record.apiBaseUrl === 'string' && record.apiBaseUrl.length > 0
              ? record.apiBaseUrl
              : '/api/v1',
          firebase: options,
          environment: typeof record.environment === 'string' ? record.environment : undefined,
          appVersion: typeof record.appVersion === 'string' ? record.appVersion : undefined,
          model: isRecord(record.model)
            ? {
                provider:
                  typeof record.model.provider === 'string' ? record.model.provider : undefined,
                modelId:
                  typeof record.model.modelId === 'string' ? record.model.modelId : undefined,
                location:
                  typeof record.model.location === 'string' ? record.model.location : undefined,
              }
            : undefined,
          featureFlags: isRecord(record.featureFlags)
            ? (Object.fromEntries(
                Object.entries(record.featureFlags).filter(([, flag]) => typeof flag === 'boolean'),
              ) as Record<string, boolean>)
            : undefined,
        };
        this.initializeFirebase(options);
        this.config.set(runtimeConfig);
        this.configState.set('ready');
        return runtimeConfig;
      })
      .catch((error: unknown) => {
        this.configState.set('error');
        this.configError.set(
          error instanceof Error ? error.message : 'Configuration could not load.',
        );
        this.configPromise = null;
        throw error;
      });
    return this.configPromise;
  }

  async signInWithGoogle(): Promise<User> {
    await this.loadConfig();
    const auth = this.requireAuth();
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    this.user.set(credential.user);
    return credential.user;
  }

  async signInWithPassword(email: string, password: string): Promise<User> {
    await this.loadConfig();
    const auth = this.requireAuth();
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    this.user.set(credential.user);
    return credential.user;
  }

  async restore(): Promise<User | null> {
    await this.loadConfig();
    const auth = this.requireAuth();
    return new Promise<User | null>((resolve) => {
      let settled = false;
      const finish = (user: User | null): void => {
        if (settled) return;
        settled = true;
        this.user.set(user);
        resolve(user);
      };
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        finish(user);
        unsubscribe();
      });
      window.setTimeout(() => finish(auth.currentUser), 1200);
    });
  }

  async idToken(forceRefresh = false): Promise<string> {
    const user = this.user();
    if (!user) throw new Error('Please sign in to continue.');
    return user.getIdToken(forceRefresh);
  }

  async logOut(): Promise<void> {
    if (this.auth) await signOut(this.auth);
    this.user.set(null);
  }

  private initializeFirebase(options: FirebaseOptions): void {
    this.app = getApps()[0] ?? initializeApp(options);
    this.auth = getAuth(this.app);
  }

  private requireAuth(): Auth {
    if (!this.auth) throw new Error('Authentication is not ready.');
    return this.auth;
  }
}
