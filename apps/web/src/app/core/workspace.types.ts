export type Stage = 'login' | 'profiles' | 'journey';
export type Language = 'hi' | 'en' | 'hinglish' | 'hi_en';
export type RouteKind = 'quick' | 'deep' | 'low_energy';

export type Profile = {
  readonly profileId: string;
  readonly displayName: string;
  readonly ageBand: string;
  readonly interfaceMode?: string;
  readonly preferredLanguage: Language;
  readonly status?: string;
  readonly seededLabel?: string;
};

export type Constitution = {
  readonly goal: string;
  readonly deadline: string | null;
  readonly sessionMinutes: number;
  readonly interfaceMode?: string;
  readonly preferredLanguages: Language[];
  readonly readingComplexity: 'simple' | 'standard' | 'advanced';
  readonly explanationDepth: 'brief' | 'conceptual' | 'deep';
  readonly challengePreference: 'gentle' | 'moderate' | 'high';
  readonly relevantContexts: string[];
  readonly allowVoiceProcessing: boolean;
  readonly allowCrossSessionPersonalization: boolean;
  readonly allowReminderNotifications: boolean;
  readonly personalizationSignals: {
    readonly correctness: boolean;
    readonly confidence: boolean;
    readonly responseTime: boolean;
    readonly hintUse: boolean;
    readonly teachBack: boolean;
    readonly transfer: boolean;
  };
  readonly accessibility: {
    readonly keyboardOnly: boolean;
    readonly reducedMotion: boolean;
    readonly captions: boolean;
    readonly textSize: 'small' | 'medium' | 'large' | 'extra_large';
    readonly highContrast: boolean;
    readonly screenReaderOptimized: boolean;
  };
};

export type DraftConstitution = Constitution;

export type LearnerState = {
  readonly status?: 'unassessed' | 'assessed';
  readonly conceptId?: string;
  readonly conceptName?: string;
  readonly mastery?: number | null;
  readonly uncertainty?: number | null;
  readonly attempts?: number;
  readonly correctAttempts?: number;
  readonly averageConfidence?: number | null;
  readonly averageResponseTimeMs?: number | null;
  readonly hintsUsed?: number;
  readonly currentScaffoldLevel?: number;
  readonly transferSuccesses?: number;
  readonly transferFailures?: number;
  readonly misconceptionSeverity?: number | null;
  readonly stateLabel?: string;
  readonly nextReviewAt?: string | null;
  readonly memoryStabilityDays?: number | null;
};

export type Recommendation = {
  readonly recommendationId?: string;
  readonly recommendedActivity?: string;
  readonly recommendedRoute?: RouteKind;
  readonly reason?: string;
  readonly evidenceEventIds?: string[];
  readonly expectedPurpose?: string;
  readonly targetConceptIds?: string[];
  readonly selectedScaffoldLevel?: number;
  readonly alternatives?: string[];
  readonly generatedAt?: string;
};

export type Evidence = {
  readonly generationMode?: 'live_model' | 'curated_fallback' | string;
  readonly feature?: string;
  readonly provider?: string;
  readonly model?: string;
  readonly modelId?: string;
  readonly requestId?: string;
  readonly traceId?: string;
  readonly generatedAt?: string;
  readonly timestamp?: string;
  readonly latencyMs?: number;
  readonly schemaValid?: boolean;
  readonly safetyValid?: boolean;
  readonly sourceConceptIds?: string[];
  readonly sourceInvariantIds?: string[];
  readonly sourceRubricId?: string;
  readonly promptTemplateVersion?: string;
  readonly fallbackReason?: string | null;
  readonly modelCallAttempted?: boolean;
  readonly modelCallSucceeded?: boolean;
  readonly stateBefore?: unknown;
  readonly stateAfter?: unknown;
  readonly deterministicReason?: string;
  readonly reason?: string;
  readonly [key: string]: unknown;
};

export type ScenarioChoice = {
  readonly id: string;
  readonly text: string;
  readonly classification?: 'safe' | 'unsafe';
};

export type Scenario = {
  readonly scenarioId?: string;
  readonly trainingLabel?: string;
  readonly title?: string;
  readonly context?: string;
  readonly channel?: string;
  readonly manipulationPatterns?: string[];
  readonly unsafeRequestCategory?: string;
  readonly prompt?: string;
  readonly choices?: ScenarioChoice[];
  readonly safestChoiceId?: string;
};

export type TeachBackAnalysis = {
  readonly correctClaims?: Array<{ readonly claim: string; readonly invariantId?: string }>;
  readonly partialClaims?: Array<{ readonly claim: string; readonly missing?: string }>;
  readonly misconceptions?: Array<{
    readonly claim: string;
    readonly misconceptionId?: string;
    readonly severity?: string;
  }>;
  readonly missingLinks?: string[];
  readonly targetedQuestion?: string;
  readonly generationMode?: string;
  readonly evidenceId?: string;
};

export type ReviewItem = {
  readonly level?: string;
  readonly nextReviewAt?: string;
  readonly intervalDays?: number;
  readonly reason?: string;
  readonly status?: string;
};

export type RecallEstimate = {
  readonly label?: string;
  readonly estimatedRecall?: number;
  readonly modelVersion?: string;
  readonly stabilityEstimateDays?: number;
  readonly elapsedDays?: number;
  readonly observationCount?: number;
  readonly expectedReviewSchedule?: string[];
  readonly generatedAt?: string;
};

export type Dashboard = {
  readonly learnerState?: LearnerState | LearnerState[];
  readonly knowledgeTwin?: LearnerState | LearnerState[];
  readonly states?: LearnerState[];
  readonly misconceptions?: Array<Record<string, unknown>>;
  readonly recommendation?: Recommendation;
  readonly route?: Recommendation;
  readonly reviews?: ReviewItem[];
  readonly memoryRadar?: RecallEstimate;
  readonly recallEstimate?: RecallEstimate;
  readonly evidence?: Evidence[] | Evidence;
  readonly analytics?: Record<string, number | string | null>;
  readonly householdAnalytics?: Record<string, number | string | null>;
  readonly [key: string]: unknown;
};

export type ProfilePayload = {
  readonly profile?: Profile;
  readonly constitution?: Constitution;
  readonly learnerState?: LearnerState | LearnerState[];
  readonly recommendation?: Recommendation;
  readonly dashboard?: Dashboard;
  readonly evidence?: Evidence[] | Evidence;
  readonly [key: string]: unknown;
};

export type BootstrapPayload = {
  readonly household?: {
    readonly householdId?: string;
    readonly displayName?: string;
    readonly profiles?: Profile[];
  };
  readonly householdId?: string;
  readonly householdName?: string;
  readonly profiles?: Profile[];
  readonly profile?: Profile;
  readonly selectedProfileId?: string;
  readonly activeProfileId?: string;
  readonly constitution?: Constitution;
  readonly dashboard?: Dashboard;
  readonly [key: string]: unknown;
};

export type ApiResponse = {
  readonly [key: string]: unknown;
};

