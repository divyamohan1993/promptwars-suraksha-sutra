import {
  learnerStateSchema,
  misconceptionSchema,
  recommendationSchema,
  reviewScheduleSchema,
  scaffoldRecommendationSchema,
  stateTransitionEvidenceSchema,
  type AssessmentRecord,
  type Concept,
  type LearnerOverride,
  type LearnerOverrideRequest,
  type LearnerState,
  type Misconception,
  type Recommendation,
  type RecallEstimate,
  type ReviewSchedule,
  type Route,
  type ScaffoldRecommendation,
  type StateTransitionEvidence,
} from '@suraksha-sutra/contracts';

/** The version is persisted with every deterministic state transition. */
export const ADAPTIVE_POLICY_VERSION = 'adaptive-policy-v1' as const;
export const EVIDENCE_FORMULA_VERSION = 'evidence-v1' as const;
export const MEMORY_FORMULA_VERSION = 'memory-radar-v1' as const;

export const HIGH_CONFIDENCE_THRESHOLD = 0.8 as const;
export const LOW_CONFIDENCE_THRESHOLD = 0.4 as const;
export const PREREQUISITE_MASTERY_THRESHOLD = 0.7 as const;
export const LOW_MASTERY_THRESHOLD = 0.5 as const;
export const VERY_LOW_MASTERY_THRESHOLD = 0.25 as const;
export const HIGH_MISCONCEPTION_THRESHOLD = 0.7 as const;
export const FAST_RESPONSE_MS = 6_000 as const;
export const INITIAL_STABILITY_DAYS = 1 as const;
export const SUCCESSFUL_RETRIEVAL_MULTIPLIER = 1.8 as const;
export const FAILED_RETRIEVAL_MULTIPLIER = 0.6 as const;
export const MIN_STABILITY_DAYS = 1 as const;
export const MAX_STABILITY_DAYS = 60 as const;
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60] as const;

export type ConfidenceQuadrant =
  | 'correct_high_confidence'
  | 'correct_low_confidence'
  | 'incorrect_high_confidence'
  | 'incorrect_low_confidence';

export type MisconceptionAction = 'none' | 'created' | 'updated' | 'resolved';

export type TeachBackEvidence = 'complete' | 'partial' | 'dangerous_misconception';

export interface CreateUnassessedStateInput {
  readonly profileId: string;
  readonly conceptId: string;
  readonly initialScaffoldLevel?: number;
  readonly evidenceEventIds?: readonly string[];
}

export interface AssessmentEvidenceInput {
  /** The persisted event that caused this observation. */
  readonly eventId: string;
  readonly assessmentId?: string;
  readonly correct: boolean;
  readonly confidence: number;
  readonly responseTimeMs: number;
  readonly hintsUsed: number;
  readonly unfamiliarContext?: boolean;
  readonly teachBackEvidence?: TeachBackEvidence;
  readonly submittedAt: string;
  /** Optional because the engine is the source of truth for this value. */
  readonly evidenceScore?: number;
  readonly transitionId?: string;
  readonly misconceptionId?: string;
  readonly misconceptionRecordId?: string;
  readonly conceptRisk?: number;
  readonly correctionInvariantId?: string;
}

/** A contract assessment record is accepted in addition to the narrow input. */
export type AssessmentInput = AssessmentEvidenceInput | AssessmentRecord;

export interface ApplyAssessmentOptions {
  readonly existingMisconception?: Misconception | null;
  readonly currentScaffoldLevel?: number;
  readonly conceptRisk?: number;
  readonly correctionInvariantId?: string;
}

export interface AssessmentResult {
  readonly state: LearnerState;
  readonly updatedState: LearnerState;
  readonly misconception: Misconception | null;
  readonly misconceptionAction: MisconceptionAction;
  readonly quadrant: ConfidenceQuadrant;
  readonly observationUncertainty: number;
  readonly evidenceScore: number;
  readonly stateTransition: StateTransitionEvidence;
  readonly transition: StateTransitionEvidence;
}

export interface RouteSelectionInput {
  readonly profileId: string;
  readonly concepts: readonly Concept[];
  readonly states: readonly LearnerState[] | Readonly<Record<string, LearnerState>>;
  readonly misconceptions?: readonly Misconception[];
  readonly relevantContexts?: readonly string[];
  readonly now: string;
  /** A learner-selected route is explicit control, never inferred. */
  readonly requestedRoute?: Route['kind'];
  readonly recommendationId?: string;
  readonly activityId?: string;
  readonly generatedAt?: string;
}

export interface RouteDecision {
  readonly profileId: string;
  readonly concept: Concept;
  readonly state: LearnerState;
  readonly recommendedRoute: Route['kind'];
  readonly priority: number;
  readonly knowledgeGap: number;
  readonly misconceptionSeverity: number;
  readonly forgettingPressure: number;
  readonly learnerRelevance: number;
  readonly graphImportance: number;
  readonly reason: string;
  readonly evidenceEventIds: readonly string[];
  readonly expectedPurpose: string;
}

export interface ScaffoldInput {
  readonly profileId: string;
  readonly conceptId: string;
  readonly state: LearnerState;
  readonly recentAssessments?: readonly ScaffoldObservation[];
  readonly evidenceEventIds?: readonly string[];
  readonly selectedLevel?: number;
  readonly scaffoldId?: string;
  readonly generatedAt: string;
}

export interface ScaffoldObservation {
  readonly eventId: string;
  readonly correct: boolean;
  readonly confidence: number;
  readonly responseTimeMs: number;
  readonly unfamiliarContext?: boolean;
  readonly hintsUsed: number;
}

export interface OverrideApplication {
  readonly override: LearnerOverride;
  readonly selectedRoute?: Route['kind'];
  readonly selectedScaffoldLevel?: number;
}

export interface OverrideOutcomeInput {
  readonly evaluatedAt: string;
  readonly verifiedPerformanceImproved: boolean;
}

export interface ReviewObservation {
  readonly eventId: string;
  readonly successful: boolean;
  readonly level?: ReviewLevel;
  readonly observedAt?: string;
}

export type ReviewLevel = ReviewSchedule['level'];

export interface ScheduleReviewInput {
  readonly profileId: string;
  readonly conceptId: string;
  readonly state: LearnerState;
  readonly scheduledAt: string;
  readonly reviewId?: string;
  readonly completedLevel?: ReviewLevel;
  readonly successful?: boolean;
  readonly sourceEventIds: readonly string[];
  readonly reason?: string;
}

export interface ReviewResult {
  readonly schedule: ReviewSchedule;
  readonly review: ReviewSchedule;
  readonly state: LearnerState;
  readonly updatedState: LearnerState;
  readonly stateTransition: StateTransitionEvidence;
}

export interface RecallObservation {
  readonly observedAt: string;
  readonly successful: boolean;
}

export interface RecallEstimateInput {
  readonly profileId: string;
  readonly conceptId: string;
  readonly state: LearnerState;
  readonly asOf: string;
  readonly retrievalObservations: readonly RecallObservation[];
  readonly generatedAt?: string;
}

export const clamp = (value: number, minimum = 0, maximum = 1): number =>
  Math.min(maximum, Math.max(minimum, value));

const requireFiniteScore = (value: number, field: string): number => {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${field} must be a finite number between 0 and 1`);
  }
  return value;
};

const requireNonNegativeInteger = (value: number, field: string): number => {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative integer`);
  }
  return value;
};

const asDate = (timestamp: string, field: string): Date => {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError(`${field} must be an ISO timestamp`);
  }
  return date;
};

const iso = (date: Date): string => date.toISOString();

const addDays = (timestamp: string, days: number): string => {
  const date = asDate(timestamp, 'timestamp');
  date.setUTCDate(date.getUTCDate() + days);
  return iso(date);
};

const daysBetween = (start: string, end: string): number => {
  const milliseconds = asDate(end, 'end').getTime() - asDate(start, 'start').getTime();
  return Math.max(0, milliseconds / 86_400_000);
};

const uniqueRecent = (existing: readonly string[], additions: readonly string[]): string[] => {
  const all = [...existing, ...additions];
  const unique = all.filter((value, index) => all.indexOf(value) === index);
  return unique.slice(-50);
};

const validateState = (state: LearnerState): LearnerState => learnerStateSchema.parse(state);

const stateSnapshot = (state: LearnerState): StateTransitionEvidence['stateBefore'] => {
  if (state.status === 'unassessed') {
    return { status: 'unassessed' };
  }
  return {
    status: 'assessed',
    mastery: state.mastery,
    uncertainty: state.uncertainty,
    misconceptionSeverity: state.misconceptionSeverity,
    memoryStabilityDays: state.memoryStabilityDays,
    nextReviewAt: state.nextReviewAt,
  };
};

const stateLabelFor = (mastery: number): LearnerState['stateLabel'] => {
  if (mastery < 0.25) return 'Unknown';
  if (mastery < 0.5) return 'Developing';
  if (mastery < 0.7) return 'Fragile';
  if (mastery < 0.85) return 'Functional';
  return 'Strong';
};

const safeId = (prefix: string, value: string): string => {
  const normalized = value.replace(/[^A-Za-z0-9._:-]/g, '-');
  return `${prefix}-${normalized}`.slice(0, 128);
};

const asMisconceptionBand = (severity: number): Misconception['severityBand'] => {
  if (severity < 0.4) return 'low';
  if (severity < 0.7) return 'medium';
  return 'high';
};

const asStateEvidenceIds = (state: LearnerState, eventId: string): string[] =>
  uniqueRecent(state.evidenceEventIds, [eventId]);

const inputEventIds = (state: LearnerState, eventId: string): string[] =>
  uniqueRecent(state.evidenceEventIds, [eventId]);

const asAssessment = (assessment: AssessmentInput): AssessmentEvidenceInput => {
  const value = assessment as AssessmentEvidenceInput;
  if (typeof value.eventId !== 'string' || value.eventId.length === 0) {
    throw new RangeError('eventId is required');
  }
  if (typeof value.correct !== 'boolean') throw new TypeError('correct must be boolean');
  requireFiniteScore(value.confidence, 'confidence');
  requireNonNegativeInteger(value.responseTimeMs, 'responseTimeMs');
  requireNonNegativeInteger(value.hintsUsed, 'hintsUsed');
  if (value.responseTimeMs > 120_000) throw new RangeError('responseTimeMs must be <= 120000');
  asDate(value.submittedAt, 'submittedAt');
  return {
    eventId: value.eventId,
    ...(value.assessmentId === undefined ? {} : { assessmentId: value.assessmentId }),
    correct: value.correct,
    confidence: value.confidence,
    responseTimeMs: value.responseTimeMs,
    hintsUsed: value.hintsUsed,
    ...(value.unfamiliarContext === undefined
      ? {}
      : { unfamiliarContext: value.unfamiliarContext }),
    ...(value.teachBackEvidence === undefined
      ? {}
      : { teachBackEvidence: value.teachBackEvidence }),
    submittedAt: value.submittedAt,
    ...(value.evidenceScore === undefined ? {} : { evidenceScore: value.evidenceScore }),
    ...(value.transitionId === undefined ? {} : { transitionId: value.transitionId }),
    ...(value.misconceptionId === undefined ? {} : { misconceptionId: value.misconceptionId }),
    ...(value.misconceptionRecordId === undefined
      ? {}
      : { misconceptionRecordId: value.misconceptionRecordId }),
    ...(value.conceptRisk === undefined ? {} : { conceptRisk: value.conceptRisk }),
    ...(value.correctionInvariantId === undefined
      ? {}
      : { correctionInvariantId: value.correctionInvariantId }),
  };
};

/** Build the schema-valid, explicitly unassessed first observation state. */
export const createUnassessedState = (input: CreateUnassessedStateInput): LearnerState => {
  const initialScaffoldLevel = input.initialScaffoldLevel ?? 1;
  if (
    !Number.isInteger(initialScaffoldLevel) ||
    initialScaffoldLevel < 1 ||
    initialScaffoldLevel > 5
  ) {
    throw new RangeError('initialScaffoldLevel must be an integer between 1 and 5');
  }
  const state: LearnerState = {
    profileId: input.profileId,
    conceptId: input.conceptId,
    evidenceEventIds: uniqueRecent([], input.evidenceEventIds ?? []),
    status: 'unassessed',
    mastery: null,
    uncertainty: null,
    attempts: 0,
    correctAttempts: 0,
    averageConfidence: null,
    averageResponseTimeMs: null,
    hintsUsed: 0,
    currentScaffoldLevel: initialScaffoldLevel,
    transferSuccesses: 0,
    transferFailures: 0,
    misconceptionSeverity: null,
    memoryStabilityDays: null,
    lastPractisedAt: null,
    nextReviewAt: null,
    stateLabel: 'Unknown',
  };
  return validateState(state);
};

/** Return the four evaluator-visible confidence/correctness quadrants. */
export const classifyConfidenceQuadrant = (
  correct: boolean,
  confidence: number,
): ConfidenceQuadrant => {
  requireFiniteScore(confidence, 'confidence');
  if (correct && confidence >= HIGH_CONFIDENCE_THRESHOLD) return 'correct_high_confidence';
  if (correct) return 'correct_low_confidence';
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return 'incorrect_high_confidence';
  return 'incorrect_low_confidence';
};

export interface EvidenceScoreInput {
  readonly correct: boolean;
  readonly confidence: number;
  readonly hintsUsed: number;
  readonly unfamiliarContext?: boolean;
  readonly teachBackEvidence?: TeachBackEvidence;
}

/** Calculate the inspectable evidence-v1 score; no model output is involved. */
export const calculateEvidenceScore = (input: EvidenceScoreInput): number => {
  requireFiniteScore(input.confidence, 'confidence');
  requireNonNegativeInteger(input.hintsUsed, 'hintsUsed');
  const correctness = input.correct ? 1 : 0;
  const hintPenalty = Math.min(0.3, input.hintsUsed * 0.1);
  const confidenceAdjustment = input.correct
    ? input.confidence >= HIGH_CONFIDENCE_THRESHOLD
      ? 0.1
      : input.confidence < LOW_CONFIDENCE_THRESHOLD
        ? -0.05
        : 0
    : input.confidence >= HIGH_CONFIDENCE_THRESHOLD
      ? -0.2
      : 0;
  const transferAdjustment = input.unfamiliarContext ? (input.correct ? 0.15 : -0.1) : 0;
  const teachBackAdjustment =
    input.teachBackEvidence === 'complete'
      ? 0.1
      : input.teachBackEvidence === 'dangerous_misconception'
        ? -0.15
        : 0;
  return clamp(
    correctness - hintPenalty + confidenceAdjustment + transferAdjustment + teachBackAdjustment,
  );
};

/** Compute the frozen misconception severity formula and its schema band. */
export const calculateMisconceptionSeverity = (input: {
  readonly recurrenceCount: number;
  readonly confidence: number;
  readonly conceptRisk: number;
}): {
  readonly recurrenceNormalized: number;
  readonly severity: number;
  readonly severityBand: Misconception['severityBand'];
} => {
  if (!Number.isInteger(input.recurrenceCount) || input.recurrenceCount < 1) {
    throw new RangeError('recurrenceCount must be a positive integer');
  }
  requireFiniteScore(input.confidence, 'confidence');
  requireFiniteScore(input.conceptRisk, 'conceptRisk');
  const recurrenceNormalized = Math.min(input.recurrenceCount / 2, 1);
  const severity = clamp(
    0.4 * recurrenceNormalized + 0.35 * input.confidence + 0.25 * input.conceptRisk,
  );
  return { recurrenceNormalized, severity, severityBand: asMisconceptionBand(severity) };
};

const misconceptionFromAssessment = (
  state: LearnerState,
  assessment: AssessmentEvidenceInput,
  options: ApplyAssessmentOptions,
): { readonly misconception: Misconception | null; readonly action: MisconceptionAction } => {
  const existing = options.existingMisconception ?? null;
  const shouldCreate = !assessment.correct && assessment.confidence >= HIGH_CONFIDENCE_THRESHOLD;
  if (!shouldCreate && existing === null) return { misconception: null, action: 'none' };

  if (existing !== null && existing.status !== 'active' && !shouldCreate) {
    return { misconception: null, action: 'none' };
  }

  const recurrenceCount =
    existing !== null && !assessment.correct
      ? existing.recurrenceCount + 1
      : (existing?.recurrenceCount ?? 1);
  const conceptRisk = assessment.conceptRisk ?? options.conceptRisk ?? existing?.conceptRisk ?? 0;
  const severityInput = calculateMisconceptionSeverity({
    recurrenceCount,
    confidence: assessment.correct
      ? (existing?.confidence ?? assessment.confidence)
      : assessment.confidence,
    conceptRisk,
  });
  const detectedAt = assessment.submittedAt;

  if (assessment.correct && existing !== null) {
    const reducedSeverity = clamp(existing.severity * 0.7);
    const resolved = reducedSeverity < 0.4;
    const misconception: Misconception = {
      ...existing,
      status: resolved ? 'resolved' : 'active',
      severity: reducedSeverity,
      severityBand: asMisconceptionBand(reducedSeverity),
      lastDetectedAt: detectedAt,
      evidenceEventIds: uniqueRecent(existing.evidenceEventIds, [assessment.eventId]),
    };
    return {
      misconception: misconceptionSchema.parse(misconception),
      action: resolved ? 'resolved' : 'updated',
    };
  }

  const misconceptionId =
    assessment.misconceptionId ??
    existing?.misconceptionId ??
    safeId('misconception', state.conceptId);
  const misconceptionRecordId =
    assessment.misconceptionRecordId ??
    existing?.misconceptionRecordId ??
    safeId('record', misconceptionId);
  const misconception: Misconception = {
    misconceptionRecordId,
    misconceptionId,
    profileId: state.profileId,
    conceptId: state.conceptId,
    status: 'active',
    severity: severityInput.severity,
    severityBand: severityInput.severityBand,
    confidence: assessment.confidence,
    recurrenceCount,
    recurrenceNormalized: severityInput.recurrenceNormalized,
    conceptRisk,
    firstDetectedAt: existing?.firstDetectedAt ?? detectedAt,
    lastDetectedAt: detectedAt,
    evidenceEventIds: uniqueRecent(existing?.evidenceEventIds ?? [], [assessment.eventId]),
    ...((assessment.correctionInvariantId ??
    options.correctionInvariantId ??
    existing?.correctionInvariantId)
      ? {
          correctionInvariantId:
            assessment.correctionInvariantId ??
            options.correctionInvariantId ??
            existing?.correctionInvariantId,
        }
      : {}),
  };
  return {
    misconception: misconceptionSchema.parse(misconception),
    action: existing === null ? 'created' : 'updated',
  };
};

/**
 * Apply one accepted assessment observation to a learner state.
 *
 * The function never accepts a model-provided mastery value. Mastery,
 * uncertainty, counters, misconception severity, and transition evidence are
 * all derived from the observation and the previous state here.
 */
export const applyAssessment = (
  inputState: LearnerState,
  rawAssessment: AssessmentInput,
  options: ApplyAssessmentOptions = {},
): AssessmentResult => {
  const state = validateState(inputState);
  const assessment = asAssessment(rawAssessment);
  const eventIds = inputEventIds(state, assessment.eventId);
  const oldMastery = state.status === 'assessed' ? state.mastery : 0;
  const previousUncertainty = state.status === 'assessed' ? state.uncertainty : 1;
  const evidenceScore = calculateEvidenceScore(assessment);
  const mastery = clamp(oldMastery * 0.65 + evidenceScore * 0.35);
  const observationUncertainty = assessment.correct
    ? 1 - assessment.confidence
    : assessment.confidence;
  const uncertainty = clamp(previousUncertainty * 0.65 + observationUncertainty * 0.35);
  const misconceptionResult = misconceptionFromAssessment(state, assessment, options);
  const previousMisconceptionSeverity =
    state.status === 'assessed' ? state.misconceptionSeverity : 0;
  const misconceptionSeverity = misconceptionResult.misconception
    ? misconceptionResult.misconception.severity
    : previousMisconceptionSeverity;
  const previousAttempts = state.status === 'assessed' ? state.attempts : 0;
  const previousCorrectAttempts = state.status === 'assessed' ? state.correctAttempts : 0;
  const previousConfidence = state.status === 'assessed' ? state.averageConfidence : 0;
  const previousResponseTime = state.status === 'assessed' ? state.averageResponseTimeMs : 0;
  const attempts = previousAttempts + 1;
  const correctAttempts = previousCorrectAttempts + (assessment.correct ? 1 : 0);
  const averageConfidence =
    (previousConfidence * previousAttempts + assessment.confidence) / attempts;
  const averageResponseTimeMs = Math.round(
    (previousResponseTime * previousAttempts + assessment.responseTimeMs) / attempts,
  );
  const transferSuccesses =
    (state.status === 'assessed' ? state.transferSuccesses : 0) +
    (assessment.unfamiliarContext && assessment.correct ? 1 : 0);
  const transferFailures =
    (state.status === 'assessed' ? state.transferFailures : 0) +
    (assessment.unfamiliarContext && !assessment.correct ? 1 : 0);
  const currentScaffoldLevel = options.currentScaffoldLevel ?? state.currentScaffoldLevel;
  if (
    !Number.isInteger(currentScaffoldLevel) ||
    currentScaffoldLevel < 1 ||
    currentScaffoldLevel > 5
  ) {
    throw new RangeError('currentScaffoldLevel must be an integer between 1 and 5');
  }
  const nextState: LearnerState = {
    profileId: state.profileId,
    conceptId: state.conceptId,
    evidenceEventIds: asStateEvidenceIds(state, assessment.eventId),
    status: 'assessed',
    mastery,
    uncertainty,
    attempts,
    correctAttempts,
    averageConfidence,
    averageResponseTimeMs,
    hintsUsed: state.hintsUsed + assessment.hintsUsed,
    currentScaffoldLevel,
    transferSuccesses,
    transferFailures,
    misconceptionSeverity,
    memoryStabilityDays:
      state.status === 'assessed' ? state.memoryStabilityDays : INITIAL_STABILITY_DAYS,
    lastPractisedAt: assessment.submittedAt,
    nextReviewAt: state.status === 'assessed' ? state.nextReviewAt : null,
    stateLabel: stateLabelFor(mastery),
  };
  const validatedNextState = validateState(nextState);
  const transition: StateTransitionEvidence = stateTransitionEvidenceSchema.parse({
    transitionId:
      assessment.transitionId ??
      safeId('transition', assessment.assessmentId ?? assessment.eventId),
    profileId: state.profileId,
    conceptId: state.conceptId,
    stateBefore: stateSnapshot(state),
    stateAfter: stateSnapshot(validatedNextState),
    formulaVersion: EVIDENCE_FORMULA_VERSION,
    inputEventIds: eventIds.length > 0 ? eventIds : [assessment.eventId],
    reason: `Applied ${classifyConfidenceQuadrant(assessment.correct, assessment.confidence)} assessment using ${EVIDENCE_FORMULA_VERSION}; evidence=${evidenceScore.toFixed(3)}, mastery ${oldMastery.toFixed(3)}→${mastery.toFixed(3)}.`,
    transitionedAt: assessment.submittedAt,
  });
  return {
    state: validatedNextState,
    updatedState: validatedNextState,
    misconception: misconceptionResult.misconception,
    misconceptionAction: misconceptionResult.action,
    quadrant: classifyConfidenceQuadrant(assessment.correct, assessment.confidence),
    observationUncertainty,
    evidenceScore,
    stateTransition: transition,
    transition,
  };
};

const statesByConcept = (
  states: readonly LearnerState[] | Readonly<Record<string, LearnerState>>,
): ReadonlyMap<string, LearnerState> => {
  if (Array.isArray(states)) return new Map(states.map((state) => [state.conceptId, state]));
  return new Map(Object.entries(states));
};

const stateForConcept = (
  map: ReadonlyMap<string, LearnerState>,
  profileId: string,
  concept: Concept,
): LearnerState =>
  map.get(concept.conceptId) ?? createUnassessedState({ profileId, conceptId: concept.conceptId });

const isDue = (state: LearnerState, now: string): boolean =>
  state.status === 'assessed' && state.nextReviewAt !== null && state.nextReviewAt <= now;

const misconceptionFor = (
  conceptId: string,
  state: LearnerState,
  misconceptions: readonly Misconception[],
): number => {
  const active = misconceptions.find(
    (misconception) => misconception.conceptId === conceptId && misconception.status === 'active',
  );
  return active?.severity ?? state.misconceptionSeverity ?? 0;
};

const routePurpose = (kind: Route['kind']): string => {
  if (kind === 'deep')
    return 'Repair the blocking gap with an explanation, worked example, and transfer check.';
  if (kind === 'low_energy')
    return 'Keep the session short with one example and two focused questions.';
  return 'Strengthen retrieval of the target concept before the estimated review window.';
};

const routeAlternativeFor = (kind: Route['kind']): readonly string[] => {
  if (kind === 'deep') return ['quick_retrieval', 'low_energy_example'];
  if (kind === 'quick') return ['deep_explanation', 'low_energy_example'];
  return ['quick_retrieval', 'deep_explanation'];
};

const routeReason = (
  decision: Omit<RouteDecision, 'recommendedRoute'> & { readonly recommendedRoute: Route['kind'] },
  explicit: boolean,
  now: string,
): string => {
  if (explicit && decision.recommendedRoute === 'low_energy') {
    return 'Low-Energy Route selected by explicit learner choice; no energy or health state was inferred.';
  }
  if (decision.state.status === 'unassessed') {
    return `This concept has no accepted observations yet, so the route establishes a baseline (priority ${decision.priority.toFixed(3)}).`;
  }
  if (decision.misconceptionSeverity >= HIGH_MISCONCEPTION_THRESHOLD) {
    return `Deep Route selected because active misconception severity is ${decision.misconceptionSeverity.toFixed(2)} and the evidence history is ${decision.evidenceEventIds.join(', ') || 'empty'}.`;
  }
  if (decision.state.mastery < LOW_MASTERY_THRESHOLD) {
    return `Deep Route selected because mastery is ${decision.state.mastery.toFixed(2)}, below ${LOW_MASTERY_THRESHOLD.toFixed(2)}.`;
  }
  if (decision.forgettingPressure > 0 || isDue(decision.state, now)) {
    return `Quick Route selected to retrieve a concept with forgetting pressure ${decision.forgettingPressure.toFixed(2)} before the next review.`;
  }
  return `Quick Route selected from deterministic priority ${decision.priority.toFixed(3)} using the learner's recorded evidence.`;
};

const buildRouteDecision = (input: RouteSelectionInput): RouteDecision => {
  const stateMap = statesByConcept(input.states);
  const misconceptions = input.misconceptions ?? [];
  const contexts = new Set(input.relevantContexts ?? []);
  const candidates = input.concepts.filter((concept) => {
    const prerequisitesReady = concept.prerequisites.every((prerequisiteId) => {
      const prerequisite = stateMap.get(prerequisiteId);
      return (
        prerequisite?.status === 'assessed' &&
        prerequisite.mastery >= PREREQUISITE_MASTERY_THRESHOLD
      );
    });
    return concept.prerequisites.length === 0 || prerequisitesReady;
  });
  const eligible =
    candidates.length > 0
      ? candidates
      : input.concepts.filter((concept) => concept.prerequisites.length === 0);
  if (eligible.length === 0) throw new RangeError('at least one concept is required');
  const scored = eligible.map((concept) => {
    const state = stateForConcept(stateMap, input.profileId, concept);
    const mastery = state.status === 'assessed' ? state.mastery : 0;
    const misconceptionSeverity = misconceptionFor(concept.conceptId, state, misconceptions);
    const stability =
      state.status === 'assessed' ? state.memoryStabilityDays : INITIAL_STABILITY_DAYS;
    const lastPractised = state.status === 'assessed' ? state.lastPractisedAt : null;
    const elapsedDays = lastPractised === null ? 0 : daysBetween(lastPractised, input.now);
    const forgettingPressure = lastPractised === null ? 0 : 1 - Math.exp(-elapsedDays / stability);
    const learnerRelevance = concept.contexts.some((context) => contexts.has(context)) ? 1 : 0.5;
    const knowledgeGap = 1 - mastery;
    const priority =
      0.3 * knowledgeGap +
      0.25 * misconceptionSeverity +
      0.2 * forgettingPressure +
      0.15 * learnerRelevance +
      0.1 * concept.reviewImportance;
    return {
      concept,
      state,
      priority,
      knowledgeGap,
      misconceptionSeverity,
      forgettingPressure,
      learnerRelevance,
    };
  });
  scored.sort((left, right) => {
    const priorityDifference = right.priority - left.priority;
    if (Math.abs(priorityDifference) > Number.EPSILON) return priorityDifference;
    const riskDifference = right.concept.riskWeight - left.concept.riskWeight;
    if (Math.abs(riskDifference) > Number.EPSILON) return riskDifference;
    return left.concept.conceptId.localeCompare(right.concept.conceptId);
  });
  const selected = scored[0];
  if (selected === undefined) throw new Error('unable to select a route candidate');
  const explicit = input.requestedRoute !== undefined;
  let recommendedRoute: Route['kind'];
  if (input.requestedRoute !== undefined) {
    recommendedRoute = input.requestedRoute;
  } else if (
    selected.state.status === 'unassessed' ||
    selected.misconceptionSeverity >= HIGH_MISCONCEPTION_THRESHOLD ||
    selected.state.mastery < LOW_MASTERY_THRESHOLD
  ) {
    recommendedRoute = 'deep';
  } else {
    recommendedRoute = 'quick';
  }
  const expectedPurpose = routePurpose(recommendedRoute);
  const decision: RouteDecision = {
    profileId: input.profileId,
    concept: selected.concept,
    state: selected.state,
    recommendedRoute,
    priority: selected.priority,
    knowledgeGap: selected.knowledgeGap,
    misconceptionSeverity: selected.misconceptionSeverity,
    forgettingPressure: selected.forgettingPressure,
    learnerRelevance: selected.learnerRelevance,
    graphImportance: selected.concept.reviewImportance,
    reason: '',
    evidenceEventIds: selected.state.evidenceEventIds,
    expectedPurpose,
  };
  return { ...decision, reason: routeReason(decision, explicit, input.now) };
};

/** Pure route selection, useful to callers that want to render custom routes. */
export const selectRoute = buildRouteDecision;

/** Produce the strict public recommendation shape with evidence and alternatives. */
export const recommendRoute = (input: RouteSelectionInput): Recommendation => {
  const decision = buildRouteDecision(input);
  const generatedAt = input.generatedAt ?? input.now;
  const routeScaffold = recommendScaffold({
    profileId: input.profileId,
    conceptId: decision.concept.conceptId,
    state: decision.state,
    evidenceEventIds: decision.evidenceEventIds,
    generatedAt,
  });
  const recommendation: Recommendation = {
    recommendationId:
      input.recommendationId ??
      safeId('recommendation', `${input.profileId}-${decision.concept.conceptId}-${generatedAt}`),
    profileId: input.profileId,
    recommendedActivity:
      input.activityId ??
      safeId(`${decision.recommendedRoute}-activity`, decision.concept.conceptId),
    recommendedRoute: decision.recommendedRoute,
    reason: decision.reason,
    evidenceEventIds: [...decision.evidenceEventIds],
    expectedPurpose: decision.expectedPurpose,
    targetConceptIds: [decision.concept.conceptId],
    selectedScaffoldLevel: routeScaffold.selectedLevel,
    alternatives: [
      ...routeAlternativeFor(decision.recommendedRoute),
    ] as Recommendation['alternatives'],
    learnerOverrideAllowed: true,
    generatedAt,
  };
  return recommendationSchema.parse(recommendation);
};

const highConfidenceWrong = (assessment: ScaffoldObservation): boolean =>
  !assessment.correct && assessment.confidence >= HIGH_CONFIDENCE_THRESHOLD;

const repeatedHintDependence = (
  state: LearnerState,
  observations: readonly ScaffoldObservation[],
): boolean =>
  state.hintsUsed >= 2 ||
  observations.filter((observation) => observation.hintsUsed > 0).length >= 2;

const hasFastCorrectTransfer = (observations: readonly ScaffoldObservation[]): boolean => {
  const contexts = observations.filter(
    (observation) => observation.correct && observation.responseTimeMs <= FAST_RESPONSE_MS,
  );
  return (
    contexts.length >= 2 && contexts.some((observation) => observation.unfamiliarContext === true)
  );
};

/** Recommend one of the five support levels using only recorded evidence. */
export const recommendScaffold = (input: ScaffoldInput): ScaffoldRecommendation => {
  const state = validateState(input.state);
  const observations = input.recentAssessments ?? [];
  const highMisconception =
    state.status === 'assessed' &&
    (state.misconceptionSeverity >= HIGH_MISCONCEPTION_THRESHOLD ||
      observations.some(highConfidenceWrong));
  let recommendedLevel: number;
  let reasonCode: ScaffoldRecommendation['reasonCode'];
  if (state.status === 'unassessed') {
    recommendedLevel = 1;
    reasonCode = 'unassessed';
  } else if (state.mastery < VERY_LOW_MASTERY_THRESHOLD) {
    recommendedLevel = 1;
    reasonCode = 'low_mastery';
  } else if (highMisconception) {
    recommendedLevel = 2;
    reasonCode = 'high_misconception';
  } else if (
    state.correctAttempts > 0 &&
    state.correctAttempts === state.attempts &&
    state.averageConfidence < LOW_CONFIDENCE_THRESHOLD
  ) {
    recommendedLevel = 2;
    reasonCode = 'correct_low_confidence';
  } else if (repeatedHintDependence(state, observations)) {
    recommendedLevel = Math.max(
      1,
      (state.status === 'assessed' ? state.currentScaffoldLevel : 1) - 1,
    );
    reasonCode = 'repeated_hint_dependence';
  } else if (hasFastCorrectTransfer(observations)) {
    recommendedLevel = 5;
    reasonCode = 'fast_correct_transfer';
  } else {
    recommendedLevel = 4;
    reasonCode = 'deterministic_default';
  }
  const selectedLevel = input.selectedLevel ?? recommendedLevel;
  if (!Number.isInteger(selectedLevel) || selectedLevel < 1 || selectedLevel > 5) {
    throw new RangeError('selectedLevel must be an integer between 1 and 5');
  }
  if (input.selectedLevel !== undefined && selectedLevel !== recommendedLevel) {
    reasonCode = 'learner_override';
  }
  const recommendation: ScaffoldRecommendation = {
    scaffoldId:
      input.scaffoldId ??
      safeId('scaffold', `${input.profileId}-${input.conceptId}-${input.generatedAt}`),
    profileId: input.profileId,
    conceptId: input.conceptId,
    recommendedLevel,
    selectedLevel,
    reasonCode,
    reason:
      reasonCode === 'learner_override'
        ? `Learner selected scaffold level ${selectedLevel}; the deterministic recommendation was level ${recommendedLevel}.`
        : `Scaffold level ${recommendedLevel} selected by ${reasonCode.replaceAll('_', ' ')} evidence.`,
    evidenceEventIds: uniqueRecent(state.evidenceEventIds, input.evidenceEventIds ?? []),
    learnerOverrideAllowed: true,
    generatedAt: input.generatedAt,
  };
  return scaffoldRecommendationSchema.parse(recommendation);
};

const selectedRouteFor = (request: LearnerOverrideRequest): Route['kind'] | undefined =>
  request.target.target === 'route' ? request.target.requestedRoute : undefined;

const selectedScaffoldFor = (request: LearnerOverrideRequest): number | undefined =>
  request.target.target === 'scaffold' ? request.target.requestedLevel : undefined;

/** Apply an explicit learner route/scaffold choice and create its audit record. */
export const applyLearnerOverride = (
  request: LearnerOverrideRequest,
  recommendation: Pick<Recommendation, 'recommendedRoute' | 'selectedScaffoldLevel'>,
): OverrideApplication => {
  const selectedRoute = selectedRouteFor(request);
  const selectedScaffoldLevel = selectedScaffoldFor(request);
  const override: LearnerOverride = {
    ...request,
    applied: true,
    verifiedPerformanceImproved: null,
    evaluatedAt: null,
  };
  if (selectedRoute !== undefined && selectedRoute === recommendation.recommendedRoute) {
    return { override, selectedRoute };
  }
  if (
    selectedScaffoldLevel !== undefined &&
    selectedScaffoldLevel === recommendation.selectedScaffoldLevel
  ) {
    return { override, selectedScaffoldLevel };
  }
  return {
    override,
    ...(selectedRoute === undefined ? {} : { selectedRoute }),
    ...(selectedScaffoldLevel === undefined ? {} : { selectedScaffoldLevel }),
  };
};

/** Attach verified performance evidence after a learner override is evaluated. */
export const evaluateOverrideOutcome = (
  override: LearnerOverride,
  outcome: OverrideOutcomeInput,
): LearnerOverride => {
  const requestedAt = asDate(override.requestedAt, 'requestedAt');
  const evaluatedAt = asDate(outcome.evaluatedAt, 'evaluatedAt');
  if (evaluatedAt.getTime() < requestedAt.getTime()) {
    throw new RangeError('evaluatedAt cannot precede requestedAt');
  }
  return {
    ...override,
    verifiedPerformanceImproved: outcome.verifiedPerformanceImproved,
    evaluatedAt: outcome.evaluatedAt,
  };
};

const reviewLevelIndex = (level: ReviewLevel): number => {
  const index = (
    ['recognition', 'recall', 'familiar_application', 'transfer', 'explanation'] as const
  ).indexOf(level);
  return index < 0 ? 0 : index;
};

const nextReviewLevel = (completedLevel: ReviewLevel, successful: boolean): ReviewLevel => {
  const levels = [
    'recognition',
    'recall',
    'familiar_application',
    'transfer',
    'explanation',
  ] as const;
  const index = reviewLevelIndex(completedLevel);
  const nextIndex = successful ? Math.min(levels.length - 1, index + 1) : Math.max(0, index - 1);
  return levels[nextIndex] ?? 'recognition';
};

const stabilityFor = (state: LearnerState, successful: boolean): number => {
  const previous = state.status === 'assessed' ? state.memoryStabilityDays : INITIAL_STABILITY_DAYS;
  const multiplier = successful ? SUCCESSFUL_RETRIEVAL_MULTIPLIER : FAILED_RETRIEVAL_MULTIPLIER;
  return clamp(previous * multiplier, MIN_STABILITY_DAYS, MAX_STABILITY_DAYS);
};

/** Schedule the next retrieval level and update memory stability deterministically. */
export const scheduleReview = (input: ScheduleReviewInput): ReviewResult => {
  const state = validateState(input.state);
  if (input.sourceEventIds.length === 0) throw new RangeError('sourceEventIds must not be empty');
  const successful = input.successful ?? true;
  const completedLevel = input.completedLevel ?? 'recognition';
  const level =
    input.completedLevel === undefined
      ? 'recognition'
      : nextReviewLevel(completedLevel, successful);
  const intervalDays = REVIEW_INTERVALS_DAYS[reviewLevelIndex(level)] ?? REVIEW_INTERVALS_DAYS[0];
  const nextReviewAt = addDays(input.scheduledAt, intervalDays);
  const memoryStabilityDays = stabilityFor(state, successful);
  const schedule: ReviewSchedule = reviewScheduleSchema.parse({
    reviewId:
      input.reviewId ??
      safeId('review', `${input.profileId}-${input.conceptId}-${input.scheduledAt}`),
    profileId: input.profileId,
    conceptId: input.conceptId,
    status: 'scheduled',
    level,
    scheduledAt: input.scheduledAt,
    nextReviewAt,
    intervalDays,
    memoryStabilityDays,
    reason:
      input.reason ??
      `${successful ? 'Successful' : 'Unsuccessful'} ${completedLevel} retrieval; next level is ${level}, stability estimate is ${memoryStabilityDays.toFixed(2)} days.`,
    sourceEventIds: uniqueRecent([], input.sourceEventIds),
    createdAt: input.scheduledAt,
  });
  const updatedState: LearnerState =
    state.status === 'unassessed'
      ? {
          ...createUnassessedState({
            profileId: input.profileId,
            conceptId: input.conceptId,
            initialScaffoldLevel: state.currentScaffoldLevel,
            evidenceEventIds: input.sourceEventIds,
          }),
        }
      : {
          ...state,
          profileId: input.profileId,
          conceptId: input.conceptId,
          memoryStabilityDays,
          nextReviewAt,
          evidenceEventIds: uniqueRecent(state.evidenceEventIds, input.sourceEventIds),
        };
  const validatedState = validateState(updatedState);
  const transition: StateTransitionEvidence = stateTransitionEvidenceSchema.parse({
    transitionId: safeId('transition', schedule.reviewId),
    profileId: input.profileId,
    conceptId: input.conceptId,
    stateBefore: stateSnapshot(state),
    stateAfter: stateSnapshot(validatedState),
    formulaVersion: MEMORY_FORMULA_VERSION,
    inputEventIds: uniqueRecent([], input.sourceEventIds),
    reason: schedule.reason,
    transitionedAt: input.scheduledAt,
  });
  return {
    schedule,
    review: schedule,
    state: validatedState,
    updatedState: validatedState,
    stateTransition: transition,
  };
};

/** Return an estimate only after two recorded retrieval observations exist. */
export const estimateRecall = (input: RecallEstimateInput): RecallEstimate | null => {
  const state = validateState(input.state);
  if (input.retrievalObservations.length < 2 || state.status !== 'assessed') return null;
  const stabilityEstimateDays = clamp(
    state.memoryStabilityDays,
    MIN_STABILITY_DAYS,
    MAX_STABILITY_DAYS,
  );
  const lastObservation = [...input.retrievalObservations]
    .sort((left, right) => left.observedAt.localeCompare(right.observedAt))
    .at(-1);
  const lastPractisedAt = lastObservation?.observedAt ?? state.lastPractisedAt;
  const elapsedDays = daysBetween(lastPractisedAt, input.asOf);
  const estimatedRecall = clamp(Math.exp(-elapsedDays / stabilityEstimateDays));
  const expectedReviewSchedule = REVIEW_INTERVALS_DAYS.slice(0, 5).map((days) =>
    addDays(input.asOf, days),
  );
  return {
    label: 'Estimated recall, not a guarantee',
    profileId: input.profileId,
    conceptId: input.conceptId,
    estimatedRecall,
    modelVersion: MEMORY_FORMULA_VERSION,
    stabilityEstimateDays,
    elapsedDays,
    observationCount: input.retrievalObservations.length,
    expectedReviewSchedule,
    generatedAt: input.generatedAt ?? input.asOf,
  };
};
