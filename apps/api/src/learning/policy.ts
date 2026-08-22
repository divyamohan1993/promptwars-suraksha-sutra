import { randomUUID } from 'node:crypto';

import type {
  LearnerState,
  Misconception,
  Recommendation,
  ReviewSchedule,
  ScaffoldRecommendation,
} from '@suraksha-sutra/contracts';
import { contractConcepts, contractInvariants, misconceptions } from '@surakshasutra/curriculum';

import type { PersistedProfile } from '../data/data.types';

export const FORMULA_VERSION = 'adaptive-policy-v1';
const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value));

export interface Observation {
  readonly profileId: string;
  readonly conceptId: string;
  readonly eventId: string;
  readonly correct: boolean;
  readonly confidence: number;
  readonly responseTimeMs: number;
  readonly hintsUsed: number;
  readonly transfer: boolean;
  readonly timestamp: string;
}

export function unassessedState(profileId: string, conceptId: string): LearnerState {
  return {
    profileId,
    conceptId,
    evidenceEventIds: [],
    status: 'unassessed',
    mastery: null,
    uncertainty: null,
    attempts: 0,
    correctAttempts: 0,
    averageConfidence: null,
    averageResponseTimeMs: null,
    hintsUsed: 0,
    currentScaffoldLevel: 1,
    transferSuccesses: 0,
    transferFailures: 0,
    misconceptionSeverity: null,
    memoryStabilityDays: null,
    lastPractisedAt: null,
    nextReviewAt: null,
    stateLabel: 'Unknown',
  };
}

export function applyObservation(
  previous: LearnerState,
  observation: Observation,
  misconceptionSeverity: number,
): LearnerState {
  const previousMastery = previous.status === 'assessed' ? previous.mastery : 0;
  const previousUncertainty = previous.status === 'assessed' ? previous.uncertainty : 1;
  const previousAttempts = previous.status === 'assessed' ? previous.attempts : 0;
  const previousCorrect = previous.status === 'assessed' ? previous.correctAttempts : 0;
  const previousConfidence = previous.status === 'assessed' ? previous.averageConfidence : 0;
  const previousResponse = previous.status === 'assessed' ? previous.averageResponseTimeMs : 0;
  const previousStability = previous.status === 'assessed' ? previous.memoryStabilityDays : 1;
  const attempts = previousAttempts + 1;
  const mastery = clamp(previousMastery * 0.65 + (observation.correct ? 1 : 0) * 0.35);
  const observationUncertainty = observation.correct
    ? 1 - observation.confidence
    : observation.confidence;
  const uncertainty = clamp(previousUncertainty * 0.65 + observationUncertainty * 0.35);
  const nextReviewAt = new Date(
    Date.parse(observation.timestamp) + previousStability * 86_400_000,
  ).toISOString();
  const transferSuccesses =
    (previous.status === 'assessed' ? previous.transferSuccesses : 0) +
    (observation.transfer && observation.correct ? 1 : 0);
  const transferFailures =
    (previous.status === 'assessed' ? previous.transferFailures : 0) +
    (observation.transfer && !observation.correct ? 1 : 0);
  return {
    profileId: observation.profileId,
    conceptId: observation.conceptId,
    evidenceEventIds: [...previous.evidenceEventIds, observation.eventId].slice(-50),
    status: 'assessed',
    mastery,
    uncertainty,
    attempts,
    correctAttempts: previousCorrect + (observation.correct ? 1 : 0),
    averageConfidence: clamp(
      (previousConfidence * previousAttempts + observation.confidence) / attempts,
    ),
    averageResponseTimeMs: Math.round(
      (previousResponse * previousAttempts + observation.responseTimeMs) / attempts,
    ),
    hintsUsed: (previous.status === 'assessed' ? previous.hintsUsed : 0) + observation.hintsUsed,
    currentScaffoldLevel: chooseScaffoldLevel({
      status: 'assessed',
      mastery,
      uncertainty,
      attempts,
      correctAttempts: previousCorrect + (observation.correct ? 1 : 0),
      averageConfidence: clamp(
        (previousConfidence * previousAttempts + observation.confidence) / attempts,
      ),
      averageResponseTimeMs: Math.round(
        (previousResponse * previousAttempts + observation.responseTimeMs) / attempts,
      ),
      hintsUsed: (previous.status === 'assessed' ? previous.hintsUsed : 0) + observation.hintsUsed,
      currentScaffoldLevel: 1,
      transferSuccesses,
      transferFailures,
      misconceptionSeverity,
      memoryStabilityDays: previousStability,
      lastPractisedAt: observation.timestamp,
      nextReviewAt,
      profileId: observation.profileId,
      conceptId: observation.conceptId,
      evidenceEventIds: [],
      stateLabel: labelForMastery(mastery),
    }),
    transferSuccesses,
    transferFailures,
    misconceptionSeverity,
    memoryStabilityDays: previousStability,
    lastPractisedAt: observation.timestamp,
    nextReviewAt,
    stateLabel: labelForMastery(mastery),
  };
}

export function updateMisconception(
  profile: PersistedProfile,
  observation: Observation,
  eventId: string,
  wrongPaymentAnswer: boolean,
): { readonly profileMisconceptions: readonly Misconception[]; readonly severity: number } {
  const existing = profile.misconceptions.find(
    (misconception) =>
      misconception.profileId === observation.profileId &&
      misconception.conceptId === observation.conceptId &&
      misconception.misconceptionId === 'pin_needed_to_receive_money',
  );
  if (!wrongPaymentAnswer) {
    const severity = existing ? clamp(existing.severity * 0.55) : 0;
    if (!existing) return { profileMisconceptions: profile.misconceptions, severity };
    const updated = {
      ...existing,
      severity,
      severityBand: severityBand(severity),
      status: severity < 0.4 ? 'resolved' : 'active',
      lastDetectedAt: observation.timestamp,
      evidenceEventIds: [...existing.evidenceEventIds, eventId].slice(-50),
    } as Misconception;
    return {
      profileMisconceptions: profile.misconceptions.map((item) =>
        item.misconceptionRecordId === existing.misconceptionRecordId ? updated : item,
      ),
      severity,
    };
  }
  const severity = clamp(0.5 + observation.confidence * 0.5);
  if (!existing) {
    const created: Misconception = {
      misconceptionRecordId: randomUUID(),
      misconceptionId: 'pin_needed_to_receive_money',
      profileId: observation.profileId,
      conceptId: observation.conceptId,
      status: 'active',
      severity,
      severityBand: severityBand(severity),
      confidence: observation.confidence,
      recurrenceCount: 1,
      recurrenceNormalized: 0.5,
      conceptRisk:
        contractConcepts.find((concept) => concept.conceptId === observation.conceptId)
          ?.riskWeight ?? 0.5,
      firstDetectedAt: observation.timestamp,
      lastDetectedAt: observation.timestamp,
      evidenceEventIds: [eventId],
      correctionInvariantId: 'inv-money-direction-01',
    };
    return { profileMisconceptions: [...profile.misconceptions, created], severity };
  }
  const recurrenceCount = existing.recurrenceCount + 1;
  const updated: Misconception = {
    ...existing,
    status: 'active',
    severity,
    severityBand: severityBand(severity),
    confidence: observation.confidence,
    recurrenceCount,
    recurrenceNormalized: clamp(recurrenceCount / 2),
    lastDetectedAt: observation.timestamp,
    evidenceEventIds: [...existing.evidenceEventIds, eventId].slice(-50),
  };
  return {
    profileMisconceptions: profile.misconceptions.map((item) =>
      item.misconceptionRecordId === existing.misconceptionRecordId ? updated : item,
    ),
    severity,
  };
}

export function makeRecommendation(
  profile: PersistedProfile,
  now: string,
  evidenceEventIds: readonly string[],
): { readonly recommendation: Recommendation; readonly scaffold: ScaffoldRecommendation } {
  const state =
    profile.states['money_in_vs_money_out'] ??
    unassessedState(profile.record.profileId, 'money_in_vs_money_out');
  const activeMisconception = profile.misconceptions
    .filter((item) => item.status === 'active')
    .sort(
      (left, right) => right.severity * right.conceptRisk - left.severity * left.conceptRisk,
    )[0];
  const highMisconception = (activeMisconception?.severity ?? 0) >= 0.7;
  const mastery = state.status === 'assessed' ? state.mastery : null;
  const due =
    state.status === 'assessed' && state.nextReviewAt !== null && state.nextReviewAt <= now;
  const recommendedRoute: Recommendation['recommendedRoute'] =
    highMisconception || mastery === null || mastery < 0.5 ? 'deep' : due ? 'quick' : 'quick';
  const reason = highMisconception
    ? 'Deep Route is recommended because a high-priority payment-direction misconception is recorded.'
    : mastery === null
      ? 'Deep Route is recommended because this concept is unassessed and needs a worked explanation.'
      : mastery < 0.5
        ? 'Deep Route is recommended because the recorded mastery is still developing.'
        : due
          ? 'Quick Route is recommended because this concept is due for retrieval.'
          : 'Quick Route is recommended from the latest assessed state and review history.';
  const selectedLevel = highMisconception ? 2 : mastery === null || (mastery ?? 0) < 0.25 ? 1 : 4;
  const scaffoldReason: ScaffoldRecommendation['reasonCode'] = highMisconception
    ? 'high_misconception'
    : mastery === null
      ? 'unassessed'
      : (mastery ?? 0) < 0.5
        ? 'low_mastery'
        : 'deterministic_default';
  const recommendation: Recommendation = {
    recommendationId: randomUUID(),
    profileId: profile.record.profileId,
    recommendedActivity: 'lesson-payment-direction',
    recommendedRoute,
    reason,
    evidenceEventIds: [...evidenceEventIds].slice(-50),
    expectedPurpose:
      recommendedRoute === 'deep'
        ? 'Repair the blocking misconception before transfer.'
        : 'Retrieve the safety invariant before it is forgotten.',
    targetConceptIds: ['money_in_vs_money_out', 'independent_verification'],
    selectedScaffoldLevel: selectedLevel,
    alternatives: recommendedRoute === 'deep' ? ['quick', 'low_energy'] : ['deep', 'low_energy'],
    learnerOverrideAllowed: true,
    generatedAt: now,
  };
  const scaffold: ScaffoldRecommendation = {
    scaffoldId: randomUUID(),
    profileId: profile.record.profileId,
    conceptId: 'money_in_vs_money_out',
    recommendedLevel: selectedLevel,
    selectedLevel,
    reasonCode: scaffoldReason,
    reason,
    evidenceEventIds: [...evidenceEventIds].slice(-50),
    learnerOverrideAllowed: true,
    generatedAt: now,
  };
  return { recommendation, scaffold };
}

export function makeReview(
  profileId: string,
  conceptId: string,
  state: LearnerState,
  sourceEventIds: readonly string[],
  now: string,
  level: ReviewSchedule['level'] = 'recognition',
): ReviewSchedule {
  const intervalDays = state.status === 'assessed' ? state.memoryStabilityDays : 1;
  const nextReviewAt =
    state.status === 'assessed' && state.nextReviewAt
      ? state.nextReviewAt
      : new Date(Date.parse(now) + 86_400_000).toISOString();
  return {
    reviewId: randomUUID(),
    profileId,
    conceptId,
    status: 'scheduled',
    level,
    scheduledAt: now,
    nextReviewAt,
    intervalDays,
    memoryStabilityDays: intervalDays,
    reason: 'Scheduled from recorded learner evidence and deterministic memory stability.',
    sourceEventIds: [...sourceEventIds].slice(-50),
    createdAt: now,
  };
}

export function chooseScaffoldLevel(state: LearnerState): number {
  if (state.status === 'unassessed') return 1;
  if (state.misconceptionSeverity >= 0.7) return 2;
  if (state.mastery < 0.25) return 1;
  if (state.averageConfidence < 0.45 && state.mastery >= 0.5) return 2;
  if (state.hintsUsed >= 2) return 3;
  if (state.averageResponseTimeMs <= 6_000 && state.correctAttempts >= 2) return 5;
  return 4;
}

function labelForMastery(mastery: number): LearnerState['stateLabel'] {
  if (mastery < 0.25) return 'Developing';
  if (mastery < 0.5) return 'Fragile';
  if (mastery < 0.75) return 'Functional';
  return 'Strong';
}

function severityBand(severity: number): Misconception['severityBand'] {
  return severity < 0.4 ? 'low' : severity < 0.7 ? 'medium' : 'high';
}

export function conceptCatalogForSeed() {
  return contractConcepts;
}

export function invariantCatalogForSeed() {
  return contractInvariants;
}

export function misconceptionCatalogForSeed() {
  return misconceptions;
}
