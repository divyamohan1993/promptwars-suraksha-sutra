import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { OnInit } from '@angular/core';

import { ApiService } from './core/api.service';
import { AuthService } from './core/auth.service';
import type {
  ApiResponse,
  BootstrapPayload,
  Constitution,
  Dashboard,
  DraftConstitution,
  Evidence,
  LearnerState,
  Language,
  Profile,
  ProfilePayload,
  Recommendation,
  ReviewItem,
  RouteKind,
  Scenario,
  ScenarioChoice,
  Stage,
  TeachBackAnalysis,
} from './core/workspace.types';

type DiagnosticView = {
  readonly diagnosticId: string;
  readonly assessmentId: string;
  readonly activityId: string;
  readonly conceptId: string;
  readonly context: string;
  readonly prompt: string;
  readonly choices: ScenarioChoice[];
};

type LessonView = {
  readonly title?: string;
  readonly objective?: string;
  readonly explanation?: string;
  readonly workedExample?: string;
  readonly sourceInvariantIds?: string[];
  readonly sourceRubricId?: string;
  readonly generationMode?: string;
};

type ScenarioResult = {
  readonly correct?: boolean;
  readonly feedback?: string;
  readonly state?: LearnerState;
  readonly evidence?: Evidence;
};

const languages: Language[] = ['hi', 'en', 'hinglish', 'hi_en'];
const contexts = [
  'upi',
  'pension',
  'messaging',
  'jobs',
  'online_shopping',
  'small_business',
  'qr_payments',
  'customer_support',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const unwrap = (value: unknown): unknown => {
  if (isRecord(value) && 'data' in value) return value.data;
  return value;
};

const firstRecord = (value: unknown, ...keys: string[]): Record<string, unknown> | null => {
  const root = unwrap(value);
  if (!isRecord(root)) return null;
  for (const key of keys) {
    const candidate = root[key];
    if (isRecord(candidate)) return candidate;
  }
  return root;
};

const stringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim().length > 0 ? value : fallback;

const numberValue = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const booleanValue = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

const arrayValue = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const normalizeProfile = (value: unknown): Profile | null => {
  if (!isRecord(value)) return null;
  const profileId = stringValue(value.profileId ?? value.id);
  const displayName = stringValue(value.displayName ?? value.name);
  const preferredLanguage = stringValue(
    value.preferredLanguage ?? value.language,
    'en',
  ) as Language;
  if (!profileId || !displayName) return null;
  return {
    profileId,
    displayName,
    ageBand: stringValue(value.ageBand, 'unspecified'),
    interfaceMode: stringValue(value.interfaceMode),
    preferredLanguage: languages.includes(preferredLanguage) ? preferredLanguage : 'en',
    status: stringValue(value.status),
    seededLabel: stringValue(value.seededLabel),
  };
};

const normalizeProfiles = (value: unknown): Profile[] => {
  const root = unwrap(value);
  if (!isRecord(root)) return [];
  const household = firstRecord(root, 'household');
  const raw =
    arrayValue<unknown>(root.profiles).length > 0
      ? arrayValue<unknown>(root.profiles)
      : arrayValue<unknown>(household?.profiles);
  return raw.map(normalizeProfile).filter((profile): profile is Profile => profile !== null);
};

const normalizeConstitution = (value: unknown): Constitution | null => {
  const source = firstRecord(value, 'constitution', 'learningConstitution');
  if (!source || typeof source.goal !== 'string') return null;
  const preferredLanguages = arrayValue<Language>(source.preferredLanguages).filter((item) =>
    languages.includes(item),
  );
  const relevantContexts = arrayValue<string>(source.relevantContexts).filter((item) =>
    contexts.includes(item as (typeof contexts)[number]),
  );
  const signals = isRecord(source.personalizationSignals) ? source.personalizationSignals : {};
  const accessibility = isRecord(source.accessibility) ? source.accessibility : {};
  return {
    goal: source.goal,
    deadline: typeof source.deadline === 'string' ? source.deadline : null,
    sessionMinutes: numberValue(source.sessionMinutes) ?? 7,
    interfaceMode: stringValue(source.interfaceMode),
    preferredLanguages: preferredLanguages.length > 0 ? preferredLanguages : ['en'],
    readingComplexity:
      source.readingComplexity === 'advanced' || source.readingComplexity === 'standard'
        ? source.readingComplexity
        : 'simple',
    explanationDepth:
      source.explanationDepth === 'deep' || source.explanationDepth === 'conceptual'
        ? source.explanationDepth
        : 'brief',
    challengePreference:
      source.challengePreference === 'high' || source.challengePreference === 'moderate'
        ? source.challengePreference
        : 'gentle',
    relevantContexts: relevantContexts.length > 0 ? relevantContexts : ['upi'],
    allowVoiceProcessing: booleanValue(source.allowVoiceProcessing),
    allowCrossSessionPersonalization: booleanValue(source.allowCrossSessionPersonalization, true),
    allowReminderNotifications: booleanValue(source.allowReminderNotifications),
    personalizationSignals: {
      correctness: booleanValue(signals.correctness, true),
      confidence: booleanValue(signals.confidence, true),
      responseTime: booleanValue(signals.responseTime, true),
      hintUse: booleanValue(signals.hintUse, true),
      teachBack: booleanValue(signals.teachBack, true),
      transfer: booleanValue(signals.transfer, true),
    },
    accessibility: {
      keyboardOnly: booleanValue(accessibility.keyboardOnly),
      reducedMotion: booleanValue(accessibility.reducedMotion, true),
      captions: booleanValue(accessibility.captions, true),
      textSize:
        accessibility.textSize === 'small' ||
        accessibility.textSize === 'medium' ||
        accessibility.textSize === 'extra_large'
          ? accessibility.textSize
          : 'large',
      highContrast: booleanValue(accessibility.highContrast),
      screenReaderOptimized: booleanValue(accessibility.screenReaderOptimized),
    },
  };
};

const normalizeState = (value: unknown): LearnerState | null => {
  if (!isRecord(value)) return null;
  const state = isRecord(value.learnerState)
    ? value.learnerState
    : isRecord(value.state)
      ? value.state
      : isRecord(value.knowledgeTwin)
        ? value.knowledgeTwin
        : (arrayValue<unknown>(value.states).find(isRecord) ?? null);
  if (!state || (!('status' in state) && !('mastery' in state))) return null;
  return state as LearnerState;
};

const normalizeRecommendation = (value: unknown): Recommendation | null => {
  const source = firstRecord(value, 'recommendation', 'routeRecommendation', 'route');
  if (!source || (!source.recommendedRoute && !source.route && !source.kind)) return null;
  const route = stringValue(source.recommendedRoute ?? source.route ?? source.kind) as RouteKind;
  return {
    recommendationId: stringValue(source.recommendationId ?? source.id),
    recommendedActivity: stringValue(source.recommendedActivity ?? source.activityId),
    recommendedRoute: route === 'deep' || route === 'low_energy' ? route : 'quick',
    reason: stringValue(source.reason),
    evidenceEventIds: arrayValue<string>(source.evidenceEventIds),
    expectedPurpose: stringValue(source.expectedPurpose ?? source.description),
    targetConceptIds: arrayValue<string>(source.targetConceptIds ?? source.conceptIds),
    selectedScaffoldLevel:
      numberValue(source.selectedScaffoldLevel ?? source.scaffoldLevel) ?? undefined,
    alternatives: arrayValue<string>(source.alternatives),
    generatedAt: stringValue(source.generatedAt),
  };
};

const normalizeEvidence = (value: unknown): Evidence | null => {
  if (!isRecord(value)) return null;
  const source = firstRecord(value, 'evidence', 'aiEvidence', 'systemEvidence') ?? value;
  const evidence: Evidence = {
    generationMode: stringValue(source.generationMode ?? source.mode),
    feature: stringValue(source.feature),
    provider: stringValue(source.provider),
    model: stringValue(source.model ?? source.modelId),
    modelId: stringValue(source.modelId),
    requestId: stringValue(source.requestId),
    traceId: stringValue(source.traceId),
    generatedAt: stringValue(source.generatedAt ?? source.timestamp ?? source.createdAt),
    timestamp: stringValue(source.timestamp),
    latencyMs: numberValue(source.latencyMs) ?? undefined,
    schemaValid: typeof source.schemaValid === 'boolean' ? source.schemaValid : undefined,
    safetyValid: typeof source.safetyValid === 'boolean' ? source.safetyValid : undefined,
    sourceConceptIds: arrayValue<string>(source.sourceConceptIds),
    sourceInvariantIds: arrayValue<string>(source.sourceInvariantIds),
    sourceRubricId: stringValue(source.sourceRubricId),
    promptTemplateVersion: stringValue(source.promptTemplateVersion),
    fallbackReason: typeof source.fallbackReason === 'string' ? source.fallbackReason : null,
    modelCallAttempted:
      typeof source.modelCallAttempted === 'boolean' ? source.modelCallAttempted : undefined,
    modelCallSucceeded:
      typeof source.modelCallSucceeded === 'boolean' ? source.modelCallSucceeded : undefined,
    stateBefore: source.stateBefore,
    stateAfter: source.stateAfter,
    deterministicReason: stringValue(source.deterministicReason ?? source.reason),
    reason: stringValue(source.reason),
  };
  return Object.values(evidence).some((item) => item !== undefined && item !== '')
    ? evidence
    : null;
};

const normalizeScenario = (value: unknown): Scenario | null => {
  const source = firstRecord(value, 'scenario', 'trainingScenario');
  if (!source || (!source.prompt && !source.title)) return null;
  const contract = isRecord(source.scenario) ? source.scenario : {};
  const choices = arrayValue<unknown>(source.choices)
    .filter(isRecord)
    .map((choice) => ({
      id: stringValue(choice.id ?? choice.choiceId),
      text: stringValue(choice.text ?? choice.label),
      classification:
        choice.classification === 'safe' || choice.classification === 'unsafe'
          ? (choice.classification as 'safe' | 'unsafe')
          : undefined,
    }))
    .filter((choice) => choice.id && choice.text);
  return {
    scenarioId: stringValue(source.scenarioId ?? source.id ?? contract.scenarioId),
    trainingLabel: stringValue(source.trainingLabel ?? source.label, 'TRAINING SIMULATION'),
    title: stringValue(source.title),
    context: stringValue(source.context ?? contract.context),
    channel: stringValue(source.channel ?? contract.channel),
    manipulationPatterns: arrayValue<string>(
      source.manipulationPatterns ?? contract.manipulationPatterns,
    ),
    unsafeRequestCategory: stringValue(
      source.unsafeRequestCategory ?? contract.unsafeRequestCategory,
    ),
    prompt: stringValue(source.prompt),
    choices,
    safestChoiceId: stringValue(source.safestChoiceId ?? contract.safestChoiceId),
  };
};

const normalizeLesson = (value: unknown): LessonView | null => {
  const source = firstRecord(value, 'lesson', 'explanation', 'adaptedExplanation');
  if (!source || (!source.explanation && !source.body && !source.text)) return null;
  return {
    title: stringValue(source.title),
    objective: stringValue(source.objective),
    explanation: stringValue(source.explanation ?? source.body ?? source.text),
    workedExample: stringValue(source.workedExample ?? source.example),
    sourceInvariantIds: arrayValue<string>(source.sourceInvariantIds),
    sourceRubricId: stringValue(source.sourceRubricId),
    generationMode: stringValue(source.generationMode),
  };
};

const normalizeDiagnostic = (value: unknown, profileId: string): DiagnosticView | null => {
  const source = firstRecord(value, 'diagnostic', 'assessment', 'question') ?? firstRecord(value);
  if (!source) return null;
  const choices = arrayValue<unknown>(source.choices ?? source.options)
    .filter(isRecord)
    .map((choice) => ({
      id: stringValue(choice.id ?? choice.choiceId ?? choice.value),
      text: stringValue(choice.text ?? choice.label ?? choice.title),
      classification:
        choice.classification === 'safe' || choice.classification === 'unsafe'
          ? (choice.classification as 'safe' | 'unsafe')
          : undefined,
    }))
    .filter((choice) => choice.id && choice.text);
  const prompt = stringValue(source.prompt ?? source.question ?? source.text);
  if (!prompt || choices.length < 2) return null;
  return {
    diagnosticId: stringValue(source.diagnosticId ?? source.id, `diagnostic-${profileId}`),
    assessmentId: stringValue(source.assessmentId, `assessment-${profileId}`),
    activityId: stringValue(source.activityId, `diagnostic-${profileId}`),
    conceptId: stringValue(
      source.conceptId ?? arrayValue<string>(source.conceptIds)[0],
      'money_in_vs_money_out',
    ),
    context: stringValue(source.context, 'upi'),
    prompt,
    choices,
  };
};

const normalizeDashboard = (value: unknown): Dashboard | null => {
  const source =
    firstRecord(value, 'dashboard', 'analytics', 'knowledgeDashboard') ?? firstRecord(value);
  return source as Dashboard | null;
};

const randomId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

@Component({
  selector: 'app-root',
  imports: [FormsModule, JsonPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  readonly stage = signal<Stage>('login');
  readonly busy = signal<string | null>(null);
  readonly error = signal('');
  readonly notice = signal('');
  readonly profiles = signal<Profile[]>([]);
  readonly selectedProfile = signal<Profile | null>(null);
  readonly constitution = signal<Constitution | null>(null);
  readonly constitutionDraft = signal<DraftConstitution | null>(null);
  readonly learnerState = signal<LearnerState | null>(null);
  readonly recommendation = signal<Recommendation | null>(null);
  readonly diagnostic = signal<DiagnosticView | null>(null);
  readonly selectedDiagnosticChoice = signal('');
  readonly confidence = signal(0.5);
  readonly selectedRoute = signal<RouteKind | null>(null);
  readonly selectedScaffold = signal<number | null>(null);
  readonly lesson = signal<LessonView | null>(null);
  readonly scenario = signal<Scenario | null>(null);
  readonly transferScenario = signal<Scenario | null>(null);
  readonly scenarioPhase = signal<'practice' | 'transfer'>('practice');
  readonly scenarioChoice = signal('');
  readonly scenarioResult = signal<ScenarioResult | null>(null);
  readonly teachBackText = signal('');
  readonly teachBackAnalysis = signal<TeachBackAnalysis | null>(null);
  readonly dashboard = signal<Dashboard | null>(null);
  readonly evidence = signal<Evidence | null>(null);
  readonly evidenceOpen = signal(false);
  readonly forceFallback = signal(false);
  readonly householdName = signal('');
  readonly profileExported = signal(false);
  readonly demoRunning = signal(false);
  readonly demoCaption = signal('');

  email = '';
  password = '';

  readonly languageOptions = languages;
  readonly contextOptions = contexts;

  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  ngOnInit(): void {
    void this.prepareApplication();
  }

  async prepareApplication(): Promise<void> {
    try {
      const config = await this.auth.loadConfig();
      this.api.setRuntimeConfig(config);
      const restoredUser = await this.auth.restore();
      if (restoredUser) await this.startSession();
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'The app could not start.');
    }
  }

  async signInWithGoogle(): Promise<void> {
    await this.runTask('login', async () => {
      await this.auth.signInWithGoogle();
      await this.startSession();
    });
  }

  async signInWithPassword(): Promise<void> {
    if (!this.email.trim() || !this.password) {
      this.error.set('Enter the evaluator email and password, or use Google sign-in.');
      return;
    }
    await this.runTask('login', async () => {
      await this.auth.signInWithPassword(this.email, this.password);
      await this.startSession();
    });
  }

  useEvaluatorCredentials(): void {
    const evaluator = this.auth.config()?.evaluatorAccess;
    if (!evaluator) return;
    this.email = evaluator.email;
    this.password = evaluator.password;
    this.notice.set('Public evaluator credentials filled. Select sign in to continue.');
  }

  async runAutomatedDemo(): Promise<void> {
    if (this.demoRunning()) return;
    const evaluator = this.auth.config()?.evaluatorAccess;
    if (!evaluator) return;
    this.demoRunning.set(true);
    try {
      this.demoCaption.set('LIVE TEST · Entering the public evaluator credentials');
      this.email = '';
      this.password = '';
      await this.demoType(evaluator.email, (value) => (this.email = value), 30);
      await this.demoWait(700);
      await this.demoType(evaluator.password, (value) => (this.password = value), 25);
      await this.demoWait(1_200);
      await this.signInWithPassword();
      await this.demoWait(2_000);
      this.demoCaption.set('THREE ISOLATED PROFILES · Resettable evaluator data');
      await this.resetEvaluator();
      this.demoScroll('#constitution-title');
      await this.demoWait(4_000);
      this.demoCaption.set('LEARNER CONTROL · Hindi, accessibility, consent and personalisation');
      await this.saveConstitution();
      this.demoScroll('#diagnostic-title');
      await this.demoWait(4_000);
      this.demoCaption.set('EDGE CASE · Incorrect answer with 95% confidence');
      const wrong =
        this.diagnostic()?.choices.find((choice) => choice.classification === 'unsafe') ??
        this.diagnostic()?.choices[0];
      if (wrong) this.setDiagnosticChoice(wrong.id);
      this.confidence.set(0.95);
      await this.demoWait(2_500);
      await this.submitDiagnostic();
      this.demoScroll('#route-title');
      await this.demoWait(4_500);
      this.demoCaption.set('DETERMINISTIC ADAPTATION · Deep Route and scaffold level 2');
      this.chooseRoute('deep');
      this.chooseScaffold(2);
      await this.demoWait(2_500);
      await this.startLesson();
      this.demoScroll('#lesson-title');
      this.demoCaption.set('GENAI IN ACTION · Vertex AI adapts approved content to this learner');
      await this.demoWait(6_000);
      this.openEvidence();
      this.demoCaption.set('AI EVIDENCE · Model, request ID, latency, validation and sources');
      await this.demoWait(7_000);
      this.closeEvidence();
      this.demoScroll('#scenario-title');
      this.demoCaption.set(
        'SAFE SIMULATOR · Fictional training with no active links or credentials',
      );
      const baseChoice = this.activeScenario()?.safestChoiceId;
      if (baseChoice) this.setScenarioChoice(baseChoice);
      await this.demoWait(3_000);
      await this.submitScenario();
      await this.demoWait(4_000);
      this.demoCaption.set('TRANSFER TEST · Same invariant in a different context');
      const transferChoice = this.activeScenario()?.safestChoiceId;
      if (transferChoice) this.setScenarioChoice(transferChoice);
      await this.demoWait(3_000);
      await this.submitScenario();
      this.demoScroll('#teachback-title');
      await this.demoWait(2_500);
      this.demoCaption.set('LIVE TEACH-BACK · Claims, gaps and one targeted question');
      const explanation =
        'Receiving money never requires me to approve an outgoing payment. I should pause and verify independently instead of trusting urgency or familiar colours.';
      this.teachBackText.set('');
      await this.demoType(explanation, (value) => this.teachBackText.set(value), 16);
      await this.demoWait(1_500);
      await this.submitTeachBack();
      await this.demoWait(6_000);
      this.demoCaption.set('VERIFIED LEARNING · Knowledge Twin, Memory Radar and analytics');
      this.demoScroll('#twin-title');
      await this.demoWait(7_000);
      this.demoCaption.set('PROFILE ISOLATION · Arjun has independent preferences and state');
      await this.selectProfile('profile-arjun');
      this.demoScroll('#constitution-title');
      await this.demoWait(5_000);
      await this.selectProfile('profile-savita');
      this.demoCaption.set('FAILURE TEST · Truthfully labelled curated fallback');
      this.toggleFallback();
      await this.startLesson();
      this.demoScroll('#lesson-title');
      await this.demoWait(6_000);
      this.openEvidence();
      await this.demoWait(7_000);
      this.closeEvidence();
      this.demoCaption.set(
        'DEMO COMPLETE · Observe → estimate → teach → assess → update → revisit',
      );
      await this.demoWait(5_000);
    } finally {
      this.demoRunning.set(false);
    }
  }

  private async demoType(text: string, update: (value: string) => void, delay: number) {
    let value = '';
    for (const character of text) {
      value += character;
      update(value);
      await this.demoWait(delay);
    }
  }

  private demoWait(delay: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, delay));
  }

  private demoScroll(selector: string): void {
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async signOut(): Promise<void> {
    await this.runTask('logout', async () => {
      await this.auth.logOut();
      this.resetJourney();
      this.stage.set('login');
      this.notice.set('You are signed out.');
    });
  }

  async startSession(): Promise<void> {
    await this.runTask('session', async () => {
      const raw = (await this.api.bootstrap()) as BootstrapPayload;
      const payload = (unwrap(raw) ?? {}) as BootstrapPayload;
      const profiles = normalizeProfiles(payload);
      this.profiles.set(profiles);
      const household = firstRecord(payload, 'household');
      this.householdName.set(
        stringValue(payload.householdName ?? household?.displayName, 'Your household'),
      );
      this.stage.set('profiles');
      const selectedId = stringValue(payload.selectedProfileId ?? payload.activeProfileId);
      if (selectedId && profiles.some((profile) => profile.profileId === selectedId)) {
        await this.selectProfile(selectedId);
      } else if (profiles.length === 1 && profiles[0]) {
        await this.selectProfile(profiles[0].profileId);
      }
    });
  }

  async selectProfile(profileId: string): Promise<void> {
    const profile = this.profiles().find((item) => item.profileId === profileId);
    if (!profile) {
      this.error.set('That learner profile is not available to this household.');
      return;
    }
    await this.runTask('profile', async () => {
      this.clearLearningSurface();
      const raw = (await this.api.getProfile(profileId)) as ProfilePayload;
      const payload = (unwrap(raw) ?? {}) as ProfilePayload;
      this.selectedProfile.set(normalizeProfile(payload.profile) ?? profile);
      const constitution = normalizeConstitution(payload);
      this.constitution.set(constitution);
      this.constitutionDraft.set(constitution ? structuredClone(constitution) : null);
      this.learnerState.set(normalizeState(payload));
      this.recommendation.set(normalizeRecommendation(payload));
      this.dashboard.set(normalizeDashboard(payload.dashboard ?? payload));
      this.captureEvidence(payload);
      this.stage.set('journey');
      await this.ensureDiagnostic(profileId, payload);
    });
  }

  patchConstitution(field: keyof DraftConstitution, value: unknown): void {
    const current = this.constitutionDraft();
    if (!current) return;
    this.constitutionDraft.set({ ...current, [field]: value } as DraftConstitution);
  }

  patchSignal(signalName: keyof Constitution['personalizationSignals'], value: boolean): void {
    const current = this.constitutionDraft();
    if (!current) return;
    this.constitutionDraft.set({
      ...current,
      personalizationSignals: { ...current.personalizationSignals, [signalName]: value },
    });
  }

  patchAccessibility(key: keyof Constitution['accessibility'], value: unknown): void {
    const current = this.constitutionDraft();
    if (!current) return;
    this.constitutionDraft.set({
      ...current,
      accessibility: { ...current.accessibility, [key]: value },
    } as DraftConstitution);
  }

  toggleLanguage(language: Language): void {
    const current = this.constitutionDraft();
    if (!current) return;
    const selected = current.preferredLanguages.includes(language)
      ? current.preferredLanguages.filter((item) => item !== language)
      : [...current.preferredLanguages, language];
    if (selected.length > 0) this.patchConstitution('preferredLanguages', selected);
  }

  toggleContext(context: string): void {
    const current = this.constitutionDraft();
    if (!current) return;
    const selected = current.relevantContexts.includes(context)
      ? current.relevantContexts.filter((item) => item !== context)
      : [...current.relevantContexts, context];
    if (selected.length > 0) this.patchConstitution('relevantContexts', selected);
  }

  async saveConstitution(): Promise<void> {
    const profile = this.selectedProfile();
    const draft = this.constitutionDraft();
    if (!profile || !draft) return;
    if (
      !draft.allowCrossSessionPersonalization &&
      Object.values(draft.personalizationSignals).some(Boolean)
    ) {
      this.error.set(
        'Turn off the individual signals before disabling cross-session personalisation.',
      );
      return;
    }
    await this.runTask('constitution', async () => {
      const raw = await this.api.updateConstitution(profile.profileId, draft);
      const updated = normalizeConstitution(raw) ?? draft;
      this.constitution.set(updated);
      this.constitutionDraft.set(structuredClone(updated));
      this.notice.set('Your learning constitution is saved for this profile.');
      this.captureEvidence(raw);
    });
  }

  exportProfile(): void {
    const profile = this.selectedProfile();
    const constitution = this.constitution();
    if (!profile || !constitution) return;
    const exportData = {
      exportedAt: new Date().toISOString(),
      profile,
      constitution,
      learnerState: this.learnerState(),
      dashboard: this.dashboard(),
      note: 'SurakshaSutra profile export. No passwords, OTPs, PINs, tokens, or raw teach-back text are included.',
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.displayName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-surakshasutra.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.profileExported.set(true);
    this.notice.set('A copy of this profile’s current evidence was downloaded.');
  }

  async resetConcept(): Promise<void> {
    const profile = this.selectedProfile();
    const conceptId = this.conceptId();
    if (!profile || !conceptId) return;
    await this.runTask('reset', async () => {
      await this.api.request('/evaluator/reset', {
        method: 'POST',
        body: { profileId: profile.profileId, conceptId },
      });
      this.notice.set(
        'This concept was reset. The next diagnostic will start from an unknown state.',
      );
      await this.selectProfile(profile.profileId);
    });
  }

  async resetEvaluator(): Promise<void> {
    await this.runTask('reset-all', async () => {
      await this.api.resetEvaluator();
      this.notice.set('Evaluator data reset. Reloading the household from the service…');
      await this.startSession();
    });
  }

  async submitDiagnostic(): Promise<void> {
    const profile = this.selectedProfile();
    const diagnostic = this.diagnostic();
    const selectedChoiceId = this.selectedDiagnosticChoice();
    if (!profile || !diagnostic || !selectedChoiceId) {
      this.error.set('Choose an answer before continuing.');
      return;
    }
    await this.runTask('diagnostic', async () => {
      const raw = await this.api.submitDiagnostic({
        diagnosticId: diagnostic.diagnosticId,
        assessmentId: diagnostic.assessmentId,
        profileId: profile.profileId,
        conceptId: diagnostic.conceptId,
        activityId: diagnostic.activityId,
        assessmentType: 'diagnostic',
        answer: { kind: 'choice', choiceId: selectedChoiceId },
        selectedChoiceId,
        confidence: this.confidence(),
        responseTimeMs: 0,
        hintsUsed: 0,
        context: diagnostic.context,
        submittedAt: new Date().toISOString(),
        idempotencyKey: randomId('diagnostic'),
      });
      const payload = (unwrap(raw) ?? {}) as ApiResponse;
      this.learnerState.set(normalizeState(payload) ?? this.learnerState());
      this.recommendation.set(normalizeRecommendation(payload) ?? this.recommendation());
      this.dashboard.set(normalizeDashboard(payload.dashboard ?? payload) ?? this.dashboard());
      this.captureEvidence(payload);
      this.selectedRoute.set(this.recommendation()?.recommendedRoute ?? 'deep');
      this.selectedScaffold.set(this.recommendation()?.selectedScaffoldLevel ?? 2);
      this.notice.set(
        'Diagnostic recorded. The recommendation is based on this learner’s evidence.',
      );
    });
  }

  chooseRoute(route: RouteKind): void {
    this.selectedRoute.set(route);
    this.notice.set(
      `You chose the ${this.routeLabel(route)}. This override is sent with the lesson request.`,
    );
  }

  chooseScaffold(level: number): void {
    if (level < 1 || level > 5) return;
    this.selectedScaffold.set(level);
    this.notice.set(`Support level ${level} selected. You can change it before the lesson starts.`);
  }

  async startLesson(): Promise<void> {
    const profile = this.selectedProfile();
    const diagnostic = this.diagnostic();
    const recommendation = this.recommendation();
    const route = this.selectedRoute() ?? recommendation?.recommendedRoute;
    const scaffoldLevel = this.selectedScaffold() ?? recommendation?.selectedScaffoldLevel;
    if (!profile || !diagnostic || !route || !scaffoldLevel) {
      this.error.set('Complete the diagnostic and choose a route first.');
      return;
    }
    await this.runTask('explanation', async () => {
      const raw = await this.api.getExplanation({
        profileId: profile.profileId,
        conceptId: diagnostic.conceptId,
        route,
        scaffoldLevel,
        recommendationId: recommendation?.recommendationId,
        language: profile.preferredLanguage,
        explanationDepth: this.constitution()?.explanationDepth,
        forceFailure: this.forceFallback(),
        idempotencyKey: randomId('explanation'),
      });
      const payload = (unwrap(raw) ?? {}) as ApiResponse;
      this.lesson.set(normalizeLesson(payload));
      this.captureEvidence(payload);
      this.notice.set(
        'The approved explanation is ready. Next, test the same invariant in a safe simulation.',
      );
      await this.loadScenario('practice');
    });
  }

  async loadScenario(phase: 'practice' | 'transfer' = 'practice'): Promise<void> {
    const profile = this.selectedProfile();
    const diagnostic = this.diagnostic();
    if (!profile || !diagnostic) return;
    const raw = await this.api.getScenario({
      profileId: profile.profileId,
      conceptId: diagnostic.conceptId,
      phase,
      route: this.selectedRoute(),
      scenarioId: phase === 'transfer' ? this.scenario()?.scenarioId : undefined,
    });
    const payload = (unwrap(raw) ?? {}) as ApiResponse;
    const scenario = normalizeScenario(payload);
    if (phase === 'transfer') this.transferScenario.set(scenario);
    else {
      this.scenario.set(scenario);
      const transferSource = firstRecord(payload, 'transferScenario', 'nextScenario');
      this.transferScenario.set(
        transferSource ? normalizeScenario({ transferScenario: transferSource }) : null,
      );
    }
    this.scenarioPhase.set(phase);
    this.scenarioChoice.set('');
    this.scenarioResult.set(null);
    this.captureEvidence(payload);
  }

  async submitScenario(): Promise<void> {
    const profile = this.selectedProfile();
    const diagnostic = this.diagnostic();
    const activeScenario = this.activeScenario();
    const choiceId = this.scenarioChoice();
    if (!profile || !diagnostic || !activeScenario || !choiceId) {
      this.error.set('Choose one safe-training response before continuing.');
      return;
    }
    await this.runTask('scenario', async () => {
      const raw = await this.api.getScenario({
        profileId: profile.profileId,
        conceptId: diagnostic.conceptId,
        phase: this.scenarioPhase(),
        scenarioId: activeScenario.scenarioId,
        choiceId,
        transfer: this.scenarioPhase() === 'transfer',
        responseTimeMs: 0,
        confidence: this.confidence(),
        idempotencyKey: randomId('scenario'),
      });
      const payload = (unwrap(raw) ?? {}) as ApiResponse;
      const result = firstRecord(payload, 'result', 'assessment', 'scenarioResult');
      this.scenarioResult.set({
        correct: typeof result?.correct === 'boolean' ? result.correct : undefined,
        feedback: stringValue(result?.feedback ?? payload.feedback),
        state: normalizeState(payload) ?? undefined,
        evidence: normalizeEvidence(payload) ?? undefined,
      });
      this.learnerState.set(normalizeState(payload) ?? this.learnerState());
      this.dashboard.set(normalizeDashboard(payload.dashboard ?? payload) ?? this.dashboard());
      this.captureEvidence(payload);
      if (this.scenarioPhase() === 'practice' && this.transferScenario()) {
        this.scenarioPhase.set('transfer');
        this.scenarioChoice.set('');
        this.notice.set('Practice recorded. The next card changes the context to test transfer.');
      } else {
        this.notice.set('Transfer recorded. Explain the invariant in your own words next.');
      }
    });
  }

  async submitTeachBack(): Promise<void> {
    const profile = this.selectedProfile();
    const diagnostic = this.diagnostic();
    const text = this.teachBackText().trim();
    if (!profile || !diagnostic || !text) {
      this.error.set('Write a short explanation before sending it for analysis.');
      return;
    }
    await this.runTask('teach-back', async () => {
      const raw = await this.api.submitTeachBack({
        teachBackId: randomId('teachback'),
        profileId: profile.profileId,
        conceptId: diagnostic.conceptId,
        rubricId: stringValue(this.lesson()?.sourceRubricId, 'rubric-payment-direction-v1'),
        input: { mode: 'text', text },
        submittedAt: new Date().toISOString(),
        idempotencyKey: randomId('teachback'),
      });
      const payload = (unwrap(raw) ?? {}) as ApiResponse;
      const analysis = firstRecord(payload, 'analysis', 'teachBack', 'teachBackOutput', 'output');
      this.teachBackAnalysis.set((analysis ?? payload) as TeachBackAnalysis);
      this.learnerState.set(normalizeState(payload) ?? this.learnerState());
      this.dashboard.set(normalizeDashboard(payload.dashboard ?? payload) ?? this.dashboard());
      this.captureEvidence(payload);
      await this.refreshDashboard();
      this.notice.set(
        'Teach-back analysed. The Knowledge Twin and Memory Radar now reflect this evidence.',
      );
    });
  }

  async refreshDashboard(): Promise<void> {
    const profile = this.selectedProfile();
    if (!profile) return;
    try {
      const raw = await this.api.getDashboard(profile.profileId);
      const payload = (unwrap(raw) ?? {}) as ApiResponse;
      this.dashboard.set(normalizeDashboard(payload));
      this.learnerState.set(normalizeState(payload) ?? this.learnerState());
      this.recommendation.set(normalizeRecommendation(payload) ?? this.recommendation());
      this.captureEvidence(payload);
    } catch {
      this.notice.set(
        'The dashboard refresh is unavailable; the last persisted view remains visible.',
      );
    }
  }

  openEvidence(): void {
    this.evidenceOpen.set(true);
  }

  closeEvidence(): void {
    this.evidenceOpen.set(false);
  }

  toggleFallback(): void {
    this.forceFallback.update((value) => !value);
    this.notice.set(
      this.forceFallback()
        ? 'The next explanation will ask the evaluator-only failure path for a truthful fallback.'
        : 'Live model mode is selected for the next explanation.',
    );
  }

  setConfidence(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const value = Number(target.value) / 100;
    if (Number.isFinite(value)) this.confidence.set(Math.max(0, Math.min(1, value)));
  }

  setDiagnosticChoice(choiceId: string): void {
    this.selectedDiagnosticChoice.set(choiceId);
  }

  setScenarioChoice(choiceId: string): void {
    this.scenarioChoice.set(choiceId);
  }

  setTeachBack(value: string): void {
    this.teachBackText.set(value);
  }

  recordNumber(value: Record<string, unknown> | null, key: string): number | null {
    const candidate = value?.[key];
    return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null;
  }

  recordString(value: Record<string, unknown> | null, key: string): string {
    return stringValue(value?.[key]);
  }

  activeScenario(): Scenario | null {
    return this.scenarioPhase() === 'transfer' ? this.transferScenario() : this.scenario();
  }

  conceptId(): string {
    return this.diagnostic()?.conceptId ?? this.learnerState()?.conceptId ?? '';
  }

  statePercent(value: number | null | undefined): string {
    return typeof value === 'number' ? `${Math.round(value * 100)}%` : 'Not enough evidence';
  }

  confidencePercent(): string {
    return `${Math.round(this.confidence() * 100)}%`;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return 'Not scheduled';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? value
      : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
          parsed,
        );
  }

  routeLabel(route: RouteKind | null | undefined): string {
    if (route === 'deep') return 'Deep Route';
    if (route === 'low_energy') return 'Low-Energy Route';
    return 'Quick Route';
  }

  languageLabel(language: string): string {
    return (
      { hi: 'हिंदी', en: 'English', hinglish: 'Hinglish', hi_en: 'हिंदी + English' }[language] ??
      language
    );
  }

  contextLabel(context: string): string {
    return context.replaceAll('_', ' ');
  }

  levelLabel(level: number | null | undefined): string {
    return (
      {
        1: 'Observe a complete example',
        2: 'Explain why each step exists',
        3: 'Complete selected missing steps',
        4: 'Solve with optional hints',
        5: 'Transfer to a new context',
      }[level ?? 0] ?? 'Support level not selected'
    );
  }

  reviewItems(): ReviewItem[] {
    return arrayValue<ReviewItem>(this.dashboard()?.reviews);
  }

  recallEstimate(): Record<string, unknown> | null {
    const estimate: unknown = this.dashboard()?.recallEstimate ?? this.dashboard()?.memoryRadar;
    if (!isRecord(estimate)) return null;
    return isRecord(estimate.estimate) ? estimate.estimate : estimate;
  }

  analyticsEntries(): Array<[string, string | number | null]> {
    const values = this.dashboard()?.householdAnalytics ?? this.dashboard()?.analytics;
    if (Array.isArray(values)) {
      return values
        .filter(isRecord)
        .map((metric) => [
          stringValue(metric.name ?? metric.metricId, 'metric'),
          typeof metric.value === 'number' ? metric.value : null,
        ]);
    }
    if (!isRecord(values)) return [];
    return Object.entries(values).filter(
      (entry): entry is [string, string | number | null] =>
        typeof entry[1] === 'string' || typeof entry[1] === 'number' || entry[1] === null,
    );
  }

  stateValue(key: keyof LearnerState): unknown {
    return this.learnerState()?.[key];
  }

  private async ensureDiagnostic(profileId: string, payload: ProfilePayload): Promise<void> {
    const inline = normalizeDiagnostic(payload, profileId);
    if (inline) {
      this.diagnostic.set(inline);
      return;
    }
    try {
      const raw = await this.api.submitDiagnostic({ profileId, action: 'start' });
      const response = (unwrap(raw) ?? {}) as ApiResponse;
      this.diagnostic.set(normalizeDiagnostic(response, profileId));
      this.captureEvidence(response);
    } catch {
      this.notice.set('The diagnostic is waiting for a connection to the learning service.');
    }
  }

  private captureEvidence(value: unknown): void {
    const evidence = normalizeEvidence(value);
    if (evidence) this.evidence.set(evidence);
  }

  private clearLearningSurface(): void {
    this.error.set('');
    this.notice.set('');
    this.constitution.set(null);
    this.constitutionDraft.set(null);
    this.learnerState.set(null);
    this.recommendation.set(null);
    this.diagnostic.set(null);
    this.selectedDiagnosticChoice.set('');
    this.lesson.set(null);
    this.scenario.set(null);
    this.transferScenario.set(null);
    this.scenarioResult.set(null);
    this.teachBackAnalysis.set(null);
    this.dashboard.set(null);
    this.evidence.set(null);
    this.selectedRoute.set(null);
    this.selectedScaffold.set(null);
    this.scenarioPhase.set('practice');
  }

  private resetJourney(): void {
    this.profiles.set([]);
    this.selectedProfile.set(null);
    this.householdName.set('');
    this.clearLearningSurface();
  }

  private async runTask(label: string, task: () => Promise<void>): Promise<void> {
    if (this.busy()) {
      await task();
      return;
    }
    this.busy.set(label);
    this.error.set('');
    try {
      await task();
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'That step could not be completed.');
    } finally {
      this.busy.set(null);
    }
  }
}
