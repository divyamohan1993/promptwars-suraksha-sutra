import { describe, expect, it } from 'vitest';
import {
  ADAPTIVE_POLICY_VERSION,
  EVIDENCE_FORMULA_VERSION,
  FAST_RESPONSE_MS,
  HIGH_CONFIDENCE_THRESHOLD,
  REVIEW_INTERVALS_DAYS,
  applyAssessment,
  applyLearnerOverride,
  calculateEvidenceScore,
  calculateMisconceptionSeverity,
  classifyConfidenceQuadrant,
  createUnassessedState,
  estimateRecall,
  evaluateOverrideOutcome,
  recommendRoute,
  recommendScaffold,
  scheduleReview,
  selectRoute,
} from '../src/index.js';
import type {
  Concept,
  LearnerOverrideRequest,
  LearnerState,
  Misconception,
  Recommendation,
} from '@suraksha-sutra/contracts';

const now = '2026-08-22T06:30:00.000Z';
const later = '2026-08-24T06:30:00.000Z';

const concept = (id: string, riskWeight = 0.95, prerequisites: string[] = []): Concept => ({
  conceptId: id,
  name: id,
  learningObjective: `Learn ${id}`,
  invariants: [`Keep ${id} safe`],
  invariantIds: [`invariant-${id}`],
  prerequisites,
  misconceptionIds: [`misconception-${id}`],
  contexts: ['upi'],
  riskWeight,
  reviewImportance: riskWeight,
  rubricId: `rubric-${id}`,
  safetyClassification: 'preventive_education',
});

const assessedState = (
  overrides: Partial<Extract<LearnerState, { status: 'assessed' }>> = {},
): LearnerState =>
  applyAssessment(createUnassessedState({ profileId: 'profile-1', conceptId: 'concept-1' }), {
    eventId: 'event-initial',
    correct: true,
    confidence: 0.9,
    responseTimeMs: 2_000,
    hintsUsed: 0,
    submittedAt: now,
  }).state.status === 'assessed'
    ? {
        ...applyAssessment(
          createUnassessedState({ profileId: 'profile-1', conceptId: 'concept-1' }),
          {
            eventId: 'event-initial',
            correct: true,
            confidence: 0.9,
            responseTimeMs: 2_000,
            hintsUsed: 0,
            submittedAt: now,
          },
        ).state,
        ...overrides,
      }
    : createUnassessedState({ profileId: 'profile-1', conceptId: 'concept-1' });

describe('confidence quadrants and evidence-v1', () => {
  it.each([
    [true, HIGH_CONFIDENCE_THRESHOLD, 'correct_high_confidence'],
    [true, 0.79, 'correct_low_confidence'],
    [false, HIGH_CONFIDENCE_THRESHOLD, 'incorrect_high_confidence'],
    [false, 0.79, 'incorrect_low_confidence'],
  ])('classifies %s/%s as %s', (correct, confidence, expected) => {
    expect(classifyConfidenceQuadrant(correct, confidence)).toBe(expected);
  });

  it('applies hint, confidence, transfer, and teach-back adjustments with clamps', () => {
    expect(
      calculateEvidenceScore({
        correct: true,
        confidence: 0.9,
        hintsUsed: 2,
        unfamiliarContext: true,
        teachBackEvidence: 'complete',
      }),
    ).toBe(1);
    expect(
      calculateEvidenceScore({
        correct: false,
        confidence: 0.9,
        hintsUsed: 20,
        unfamiliarContext: true,
        teachBackEvidence: 'dangerous_misconception',
      }),
    ).toBe(0);
    expect(calculateEvidenceScore({ correct: true, confidence: 0.39, hintsUsed: 0 })).toBeCloseTo(
      0.95,
    );
  });

  it('uses the frozen misconception formula and boundaries', () => {
    expect(
      calculateMisconceptionSeverity({ recurrenceCount: 1, confidence: 0.9, conceptRisk: 0.95 }),
    ).toEqual({
      recurrenceNormalized: 0.5,
      severity: 0.7525,
      severityBand: 'high',
    });
    expect(
      calculateMisconceptionSeverity({ recurrenceCount: 2, confidence: 0, conceptRisk: 0 })
        .severityBand,
    ).toBe('medium');
    expect(
      calculateMisconceptionSeverity({ recurrenceCount: 1, confidence: 0, conceptRisk: 0 })
        .severityBand,
    ).toBe('low');
  });
});

describe('assessment state transitions', () => {
  it('creates an unassessed state without fabricated learner values', () => {
    const state = createUnassessedState({ profileId: 'profile-1', conceptId: 'concept-1' });
    expect(state).toMatchObject({
      status: 'unassessed',
      mastery: null,
      uncertainty: null,
      attempts: 0,
    });
  });

  it.each([
    [true, 0.9, 'correct_high_confidence'],
    [true, 0.2, 'correct_low_confidence'],
    [false, 0.9, 'incorrect_high_confidence'],
    [false, 0.2, 'incorrect_low_confidence'],
  ])(
    'updates each quadrant through the same deterministic path',
    (correct, confidence, quadrant) => {
      const result = applyAssessment(
        createUnassessedState({ profileId: 'profile-1', conceptId: 'concept-1' }),
        {
          eventId: `event-${String(correct)}-${String(confidence)}`,
          correct,
          confidence,
          responseTimeMs: 1_000,
          hintsUsed: 0,
          submittedAt: now,
          conceptRisk: 0.95,
          misconceptionId: 'pin_needed_to_receive_money',
        },
      );
      expect(result.quadrant).toBe(quadrant);
      expect(result.state.status).toBe('assessed');
      expect(result.stateTransition.formulaVersion).toBe(EVIDENCE_FORMULA_VERSION);
      expect(result.stateTransition.inputEventIds).toContain(result.state.evidenceEventIds[0]);
    },
  );

  it('creates and then updates a high-confidence-wrong misconception', () => {
    const initial = createUnassessedState({ profileId: 'profile-1', conceptId: 'concept-1' });
    const first = applyAssessment(initial, {
      eventId: 'event-wrong-1',
      correct: false,
      confidence: 0.9,
      responseTimeMs: 12_000,
      hintsUsed: 0,
      submittedAt: now,
      conceptRisk: 0.95,
      misconceptionId: 'pin_needed_to_receive_money',
    });
    expect(first.misconceptionAction).toBe('created');
    expect(first.misconception?.severity).toBe(0.7525);
    const second = applyAssessment(
      first.state,
      {
        eventId: 'event-wrong-2',
        correct: false,
        confidence: 0.9,
        responseTimeMs: 11_000,
        hintsUsed: 0,
        submittedAt: later,
        conceptRisk: 0.95,
        misconceptionId: 'pin_needed_to_receive_money',
      },
      { existingMisconception: first.misconception },
    );
    expect(second.misconceptionAction).toBe('updated');
    expect(second.misconception?.recurrenceCount).toBe(2);
    expect(second.misconception?.severity).toBeCloseTo(0.9525);
  });

  it('reduces a misconception after a verified correct response', () => {
    const state = assessedState();
    const existing: Misconception = {
      misconceptionRecordId: 'record-1',
      misconceptionId: 'misconception-1',
      profileId: 'profile-1',
      conceptId: 'concept-1',
      status: 'active',
      severity: 0.5,
      severityBand: 'medium',
      confidence: 0.9,
      recurrenceCount: 2,
      recurrenceNormalized: 1,
      conceptRisk: 0.8,
      firstDetectedAt: now,
      lastDetectedAt: now,
      evidenceEventIds: ['event-wrong'],
    };
    const result = applyAssessment(
      state,
      {
        eventId: 'event-correct',
        correct: true,
        confidence: 0.8,
        responseTimeMs: 1_000,
        hintsUsed: 0,
        submittedAt: later,
      },
      { existingMisconception: existing },
    );
    expect(result.misconceptionAction).toBe('resolved');
    expect(result.misconception?.severity).toBeCloseTo(0.35);
    expect(result.state.misconceptionSeverity).toBeCloseTo(0.35);
  });
});

describe('route and scaffold policy', () => {
  it('selects deep route for an unassessed or low mastery concept and exposes evidence', () => {
    const recommendation = recommendRoute({
      profileId: 'profile-1',
      concepts: [concept('concept-1')],
      states: [createUnassessedState({ profileId: 'profile-1', conceptId: 'concept-1' })],
      relevantContexts: ['upi'],
      now,
      recommendationId: 'recommendation-1',
      activityId: 'activity-1',
    });
    expect(recommendation.recommendedRoute).toBe('deep');
    expect(recommendation.selectedScaffoldLevel).toBe(1);
    expect(recommendation.alternatives).toEqual(['quick_retrieval', 'low_energy_example']);
    expect(recommendation.reason).toContain('no accepted observations');
  });

  it('honours an explicit low-energy route without inferring fatigue', () => {
    const state = assessedState();
    const recommendation = recommendRoute({
      profileId: 'profile-1',
      concepts: [concept('concept-1')],
      states: [state],
      requestedRoute: 'low_energy',
      now,
      recommendationId: 'recommendation-2',
      activityId: 'activity-2',
    });
    expect(recommendation.recommendedRoute).toBe('low_energy');
    expect(recommendation.reason).toContain('explicit learner choice');
  });

  it('uses deterministic risk and lexical ties and prerequisite eligibility', () => {
    const first = concept('concept-a', 0.8);
    const second = concept('concept-b', 0.8);
    expect(
      selectRoute({
        profileId: 'profile-1',
        concepts: [second, first],
        states: [],
        now,
      }).concept.conceptId,
    ).toBe('concept-a');
    const gated = concept('gated', 1, ['prerequisite']);
    const ready = concept('ready', 0.1);
    expect(
      selectRoute({
        profileId: 'profile-1',
        concepts: [gated, ready],
        states: [assessedState({ conceptId: 'prerequisite', mastery: 0.69 })],
        now,
      }).concept.conceptId,
    ).toBe('ready');
  });

  it('covers scaffold levels, overrides, hints, and fast transfer', () => {
    const unassessed = createUnassessedState({ profileId: 'profile-1', conceptId: 'concept-1' });
    expect(
      recommendScaffold({
        profileId: 'profile-1',
        conceptId: 'concept-1',
        state: unassessed,
        generatedAt: now,
      }).recommendedLevel,
    ).toBe(1);
    const lowMastery = assessedState({ mastery: 0.2, stateLabel: 'Unknown' });
    expect(
      recommendScaffold({
        profileId: 'profile-1',
        conceptId: 'concept-1',
        state: lowMastery,
        generatedAt: now,
      }).reasonCode,
    ).toBe('low_mastery');
    const highMisconception = assessedState({
      mastery: 0.5,
      misconceptionSeverity: 0.7,
      stateLabel: 'Fragile',
    });
    expect(
      recommendScaffold({
        profileId: 'profile-1',
        conceptId: 'concept-1',
        state: highMisconception,
        generatedAt: now,
      }).recommendedLevel,
    ).toBe(2);
    const lowConfidence = assessedState({ averageConfidence: 0.2, stateLabel: 'Strong' });
    expect(
      recommendScaffold({
        profileId: 'profile-1',
        conceptId: 'concept-1',
        state: lowConfidence,
        generatedAt: now,
      }).reasonCode,
    ).toBe('correct_low_confidence');
    const hintState = assessedState({ hintsUsed: 2, currentScaffoldLevel: 4 });
    expect(
      recommendScaffold({
        profileId: 'profile-1',
        conceptId: 'concept-1',
        state: hintState,
        generatedAt: now,
      }).recommendedLevel,
    ).toBe(3);
    const fast = assessedState();
    expect(
      recommendScaffold({
        profileId: 'profile-1',
        conceptId: 'concept-1',
        state: fast,
        recentAssessments: [
          {
            eventId: 'fast-1',
            correct: true,
            confidence: 0.9,
            responseTimeMs: FAST_RESPONSE_MS,
            hintsUsed: 0,
          },
          {
            eventId: 'fast-2',
            correct: true,
            confidence: 0.9,
            responseTimeMs: FAST_RESPONSE_MS,
            unfamiliarContext: true,
            hintsUsed: 0,
          },
        ],
        generatedAt: now,
      }).recommendedLevel,
    ).toBe(5);
    expect(
      recommendScaffold({
        profileId: 'profile-1',
        conceptId: 'concept-1',
        state: fast,
        selectedLevel: 3,
        generatedAt: now,
      }).reasonCode,
    ).toBe('learner_override');
  });
});

describe('learner override audit', () => {
  const request: LearnerOverrideRequest = {
    overrideId: 'override-1',
    profileId: 'profile-1',
    recommendationId: 'recommendation-1',
    target: { target: 'route', requestedRoute: 'quick' },
    requestedAt: now,
    idempotencyKey: 'idempotency-1',
  };
  const recommendation: Pick<Recommendation, 'recommendedRoute' | 'selectedScaffoldLevel'> = {
    recommendedRoute: 'deep',
    selectedScaffoldLevel: 2,
  };

  it('applies and evaluates explicit route overrides', () => {
    const applied = applyLearnerOverride(request, recommendation);
    expect(applied.override.applied).toBe(true);
    expect(applied.selectedRoute).toBe('quick');
    const evaluated = evaluateOverrideOutcome(applied.override, {
      evaluatedAt: later,
      verifiedPerformanceImproved: true,
    });
    expect(evaluated.verifiedPerformanceImproved).toBe(true);
    expect(evaluated.evaluatedAt).toBe(later);
  });

  it('supports scaffold override and rejects a backwards outcome timestamp', () => {
    const scaffoldRequest: LearnerOverrideRequest = {
      ...request,
      overrideId: 'override-2',
      target: { target: 'scaffold', requestedLevel: 5 },
    };
    expect(applyLearnerOverride(scaffoldRequest, recommendation).selectedScaffoldLevel).toBe(5);
    expect(() =>
      evaluateOverrideOutcome(applyLearnerOverride(request, recommendation).override, {
        evaluatedAt: '2026-08-21T00:00:00.000Z',
        verifiedPerformanceImproved: false,
      }),
    ).toThrow();
  });
});

describe('review scheduling and recall estimate', () => {
  it('progresses review levels through the fixed interval table', () => {
    let state = assessedState({ memoryStabilityDays: 1 });
    const levels = [
      'recognition',
      'recall',
      'familiar_application',
      'transfer',
      'explanation',
    ] as const;
    for (const [index, level] of levels.entries()) {
      const result = scheduleReview({
        profileId: 'profile-1',
        conceptId: 'concept-1',
        state,
        scheduledAt: now,
        completedLevel: level,
        successful: true,
        sourceEventIds: [`review-event-${index}`],
      });
      expect(result.schedule.level).toBe(levels[Math.min(index + 1, levels.length - 1)]);
      expect(result.schedule.intervalDays).toBe(
        REVIEW_INTERVALS_DAYS[Math.min(index + 1, levels.length - 1)],
      );
      expect(result.state.memoryStabilityDays).toBeGreaterThanOrEqual(1);
      state = result.state;
    }
    const failed = scheduleReview({
      profileId: 'profile-1',
      conceptId: 'concept-1',
      state,
      scheduledAt: later,
      completedLevel: 'explanation',
      successful: false,
      sourceEventIds: ['review-failed'],
    });
    expect(failed.schedule.level).toBe('transfer');
    expect(failed.state.memoryStabilityDays).toBeGreaterThanOrEqual(1);
  });

  it('does not fabricate a recall estimate before two retrieval observations', () => {
    const state = assessedState({ memoryStabilityDays: 2 });
    expect(
      estimateRecall({
        profileId: 'profile-1',
        conceptId: 'concept-1',
        state,
        asOf: later,
        retrievalObservations: [{ observedAt: now, successful: true }],
      }),
    ).toBeNull();
    const estimate = estimateRecall({
      profileId: 'profile-1',
      conceptId: 'concept-1',
      state,
      asOf: later,
      retrievalObservations: [
        { observedAt: now, successful: true },
        { observedAt: later, successful: true },
      ],
    });
    expect(estimate?.label).toBe('Estimated recall, not a guarantee');
    expect(estimate?.observationCount).toBe(2);
    expect(estimate?.estimatedRecall).toBeGreaterThan(0);
    expect(estimate?.expectedReviewSchedule).toHaveLength(5);
  });
});

describe('policy constants', () => {
  it('exposes versioned policy identifiers', () => {
    expect(ADAPTIVE_POLICY_VERSION).toBe('adaptive-policy-v1');
    expect(REVIEW_INTERVALS_DAYS).toEqual([1, 3, 7, 14, 30, 60]);
  });
});
