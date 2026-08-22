/**
 * Curated curriculum data is deliberately kept separate from learner state.
 * These are the content shapes consumed by the shared contract adapter at the
 * application boundary; they contain no profile outcomes, analytics, or model
 * observations.
 */

export const curriculumLanguages = ['hi', 'en', 'hinglish', 'hi_en'] as const;
export type CurriculumLanguage = (typeof curriculumLanguages)[number];

export const profileIds = ['profile-savita', 'profile-arjun', 'profile-ramesh'] as const;
export type DemoProfileId = (typeof profileIds)[number];

export const requiredProfileContexts = [
  'pension',
  'messaging',
  'upi',
  'internship',
  'gaming',
  'online_shopping',
  'small_business',
  'qr_payments',
  'customer_support',
] as const;
export type RequiredProfileContext = (typeof requiredProfileContexts)[number];

export type SafetyClassification = 'safe' | 'unsafe';
export type ScenarioKind = 'base' | 'transfer';
export type ScenarioVisual =
  | 'chat-bubble'
  | 'payment-card'
  | 'printed-notice'
  | 'notification-card'
  | 'job-offer-card'
  | 'game-reward-card'
  | 'delivery-status-card'
  | 'shop-counter-note'
  | 'qr-style-training-card'
  | 'support-call-summary';

export interface LocalizedText {
  readonly hi: string;
  readonly en: string;
}

export interface ProfileLocalizedText extends LocalizedText {
  readonly hinglish: string;
  readonly hi_en: string;
}

export interface CurriculumInvariant {
  readonly invariantId: string;
  readonly conceptId: string;
  readonly statement: LocalizedText;
  readonly safeAction: LocalizedText;
  readonly tags: readonly string[];
}

export interface CurriculumConcept {
  readonly conceptId: string;
  readonly name: LocalizedText;
  readonly learningObjective: ProfileLocalizedText;
  readonly invariantIds: readonly string[];
  readonly prerequisites: readonly string[];
  readonly misconceptionIds: readonly string[];
  readonly contexts: readonly string[];
  readonly riskWeight: number;
  readonly reviewImportance: number;
  readonly rubricId: string;
  readonly safetyClassification: 'preventive_education';
}

export interface CurriculumMisconception {
  readonly misconceptionId: string;
  readonly conceptId: string;
  readonly label: ProfileLocalizedText;
  readonly description: ProfileLocalizedText;
  readonly severityCeiling: 'low' | 'medium' | 'high';
  readonly triggerPatterns: readonly string[];
  readonly correctionInvariantIds: readonly string[];
  readonly targetedQuestion: ProfileLocalizedText;
}

export interface RubricCriterion {
  readonly criterionId: string;
  readonly description: ProfileLocalizedText;
  readonly points: number;
}

export interface CurriculumRubric {
  readonly rubricId: string;
  readonly version: string;
  readonly conceptIds: readonly string[];
  readonly invariantIds: readonly string[];
  readonly criteria: readonly RubricCriterion[];
  readonly targetedQuestion: ProfileLocalizedText;
  readonly feedbackTemplate: ProfileLocalizedText;
}

export interface ScenarioChoice {
  readonly id: string;
  readonly text: ProfileLocalizedText;
  readonly classification: SafetyClassification;
  readonly feedback: ProfileLocalizedText;
}

export interface ScenarioConstraints {
  readonly activeLinks: false;
  readonly realOrganizations: false;
  readonly realPhoneNumbers: false;
  readonly realCredentials: false;
  readonly operationalFraudInstructions: false;
}

export interface CurriculumScenario {
  readonly scenarioId: string;
  readonly trainingLabel: 'TRAINING SIMULATION';
  readonly kind: ScenarioKind;
  readonly title: ProfileLocalizedText;
  readonly conceptIds: readonly string[];
  readonly invariantIds: readonly string[];
  readonly context: RequiredProfileContext | 'payment_direction' | 'small_merchant';
  readonly channel:
    'fictional_chat' | 'fictional_notice' | 'fictional_notification' | 'fictional_call_summary';
  readonly visual: ScenarioVisual;
  readonly manipulationPatterns: readonly string[];
  readonly unsafeRequestCategory: 'authorize_outgoing_action';
  readonly prompt: ProfileLocalizedText;
  readonly choices: readonly ScenarioChoice[];
  readonly safestChoiceId: string;
  readonly safestAction: ProfileLocalizedText;
  readonly feedbackRubricId: string;
  readonly transferScenarioIds: readonly string[];
  readonly constraints: ScenarioConstraints;
}

export type CurriculumCopyKey =
  | 'appName'
  | 'tagline'
  | 'trainingSimulation'
  | 'liveModelOutput'
  | 'curatedFallback'
  | 'seededStartingState'
  | 'diagnosticHeading'
  | 'diagnosticPrompt'
  | 'confidencePrompt'
  | 'confidenceLow'
  | 'confidenceHigh'
  | 'routeHeading'
  | 'routeWhy'
  | 'quickRoute'
  | 'deepRoute'
  | 'lowEnergyRoute'
  | 'scaffoldHeading'
  | 'scaffoldOne'
  | 'scaffoldTwo'
  | 'scaffoldThree'
  | 'scaffoldFour'
  | 'scaffoldFive'
  | 'simulateHeading'
  | 'transferHeading'
  | 'teachBackHeading'
  | 'teachBackPrompt'
  | 'teachBackCorrect'
  | 'teachBackPartial'
  | 'teachBackMisconception'
  | 'teachBackMissingLink'
  | 'teachBackQuestion'
  | 'memoryRadarHeading'
  | 'memoryEstimateLabel'
  | 'memoryAssumptions'
  | 'evidenceHeading'
  | 'pauseAndVerify'
  | 'continue'
  | 'chooseDifferentRoute'
  | 'resetConcept'
  | 'fallbackSentence'
  | 'noSecrets'
  | 'noActiveLinks'
  | 'profileSavita'
  | 'profileArjun'
  | 'profileRamesh';

export type UiCopy = Readonly<Record<CurriculumCopyKey, string>>;

export interface FallbackExplanation {
  readonly generationMode: 'curated_fallback';
  readonly modelCallAttempted: true;
  readonly modelCallSucceeded: false;
  readonly fallbackReason:
    'timeout' | 'refusal' | 'schema_invalid' | 'safety_rejection' | 'provider_error';
  readonly displayLabel: 'Curated fallback used because the live model was unavailable or its output was rejected.';
  readonly explanation: ProfileLocalizedText;
  readonly sourceConceptIds: readonly string[];
  readonly sourceInvariantIds: readonly string[];
}

export interface TeachBackClaim {
  readonly claim: string;
  readonly invariantId: string;
}

export interface TeachBackPartialClaim {
  readonly claim: string;
  readonly missing: string;
}

export interface TeachBackMisconception {
  readonly claim: string;
  readonly misconceptionId: string;
  readonly severity: 'high';
}

export interface FallbackTeachBack {
  readonly generationMode: 'curated_fallback';
  readonly modelCallAttempted: true;
  readonly modelCallSucceeded: false;
  readonly fallbackReason: FallbackExplanation['fallbackReason'];
  readonly displayLabel: 'Curated fallback used because the live model was unavailable or its output was rejected.';
  readonly correctClaims: readonly TeachBackClaim[];
  readonly partialClaims: readonly TeachBackPartialClaim[];
  readonly misconceptions: readonly TeachBackMisconception[];
  readonly missingLinks: readonly string[];
  readonly targetedQuestion: ProfileLocalizedText;
  readonly rubricVersion: string;
}

export interface SafetyViolation {
  readonly code:
    | 'url'
    | 'phone_number'
    | 'credential_request'
    | 'real_institution'
    | 'html_or_script'
    | 'operational_instruction'
    | 'prompt_injection'
    | 'unknown_id'
    | 'missing_training_label'
    | 'unsafe_constraint'
    | 'missing_invariant'
    | 'invalid_safest_choice';
  readonly path: string;
  readonly message: string;
  readonly match?: string;
}

export interface SafetyValidationResult {
  readonly safe: boolean;
  readonly violations: readonly SafetyViolation[];
}

export interface CurriculumIdAllowlist {
  readonly conceptIds: ReadonlySet<string>;
  readonly invariantIds: ReadonlySet<string>;
  readonly misconceptionIds: ReadonlySet<string>;
  readonly rubricIds: ReadonlySet<string>;
  readonly scenarioIds: ReadonlySet<string>;
}
