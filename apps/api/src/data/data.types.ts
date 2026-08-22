import type {
  AnalyticsEvent,
  ConstitutionRecord,
  HouseholdRecord,
  LearnerState,
  Misconception,
  ProfileRecord,
  Recommendation,
  ReviewSchedule,
  ScaffoldRecommendation,
} from '@suraksha-sutra/contracts';

export interface EvidenceRecord {
  readonly evidenceId: string;
  readonly feature: 'adaptive_explanation' | 'teach_back_extraction' | 'state_transition';
  readonly generationMode?: 'live_model' | 'curated_fallback';
  readonly provider?: 'vertex-ai';
  readonly model?: string;
  readonly requestId: string;
  readonly generatedAt: string;
  readonly latencyMs?: number;
  readonly schemaValid: boolean;
  readonly safetyValid: boolean;
  readonly sourceConceptIds: readonly string[];
  readonly learnerStateBefore?: Record<string, unknown>;
  readonly learnerStateAfter?: Record<string, unknown>;
  readonly deterministicReason?: string;
  readonly failureReason?: string;
  readonly fallbackLabel?: string;
}

export interface PersistedProfile {
  readonly record: ProfileRecord;
  readonly constitution: ConstitutionRecord;
  readonly scenarioIds: readonly string[];
  readonly currentScenarioId: string;
  readonly currentTransferScenarioId: string | null;
  readonly states: Readonly<Record<string, LearnerState>>;
  readonly misconceptions: readonly Misconception[];
  readonly reviews: readonly ReviewSchedule[];
  readonly events: readonly AnalyticsEvent[];
  readonly evidence: readonly EvidenceRecord[];
  readonly recommendation: Recommendation | null;
  readonly scaffold: ScaffoldRecommendation | null;
  readonly selectedRoute: 'quick' | 'deep' | 'low_energy' | null;
  readonly selectedScaffoldLevel: number;
  readonly updatedAt: string;
}

export interface HouseholdBundle {
  readonly record: HouseholdRecord;
  readonly selectedProfileId: string;
  readonly profiles: Readonly<Record<string, PersistedProfile>>;
  readonly updatedAt: string;
}

export interface DataRepository {
  findHouseholdForSubject(subjectId: string): Promise<HouseholdBundle | null>;
  getHousehold(householdId: string): Promise<HouseholdBundle | null>;
  getProfile(householdId: string, profileId: string): Promise<PersistedProfile | null>;
  saveBundle(bundle: HouseholdBundle): Promise<void>;
  saveProfile(householdId: string, profile: PersistedProfile): Promise<void>;
  resetSubject(subjectId: string, bundle: HouseholdBundle): Promise<void>;
}
