import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  analyticsEventSchema,
  constitutionUpdateRequestSchema,
  learnerStateSchema,
  recommendationSchema,
  reviewScheduleSchema,
  scaffoldRecommendationSchema,
  type AnalyticsEvent,
  type AnalyticsMetric,
  type ConstitutionRecord,
  type HouseholdRecord,
  type LearnerState,
  type Misconception,
  type ProfileRecord,
  type Recommendation,
  type ReviewSchedule,
} from '@suraksha-sutra/contracts';
import {
  BASE_SCENARIO_ID,
  baseScenario,
  contractConcepts,
  contractScenarios,
  profileCopy,
  scenarioById,
  validateScenarioSafety,
} from '@surakshasutra/curriculum';

import { getRuntimeEnvironment, type RuntimeEnvironment } from '../config/runtime-environment';
import type { AuthenticatedUser } from '../auth/auth.types';
import type {
  EvidenceRecord,
  HouseholdBundle,
  PersistedProfile,
  DataRepository,
} from '../data/data.types';
import { DATA_REPOSITORY } from '../data/repository.token';
import { VertexGateway } from '../ai/vertex.gateway';
import {
  applyObservation,
  FORMULA_VERSION,
  makeRecommendation,
  makeReview,
  unassessedState,
  updateMisconception,
  type Observation,
} from './policy';
import { createSeedBundle, isSeedBundle } from './seed';
import {
  bootstrapRequestSchema,
  constitutionRequestSchema,
  diagnosticRequestSchema,
  explanationRequestSchema,
  scenarioRequestSchema,
  teachBackRequestSchema,
  type DiagnosticRequest,
  type ExplanationRequest,
  type ScenarioRequest,
  type TeachBackRequest,
} from './input.schemas';

const SEEDED_STATE_LABEL = 'Seeded starting state';
const FALLBACK_LABEL =
  'Curated fallback used because the live model was unavailable or its output was rejected.';

@Injectable()
export class LearningService {
  private readonly environment: RuntimeEnvironment;

  public constructor(
    @Inject(DATA_REPOSITORY) private readonly repository: DataRepository,
    @Inject(VertexGateway) private readonly vertex: VertexGateway,
    @Inject(ConfigService) config: ConfigService<RuntimeEnvironment>,
  ) {
    this.environment = getRuntimeEnvironment(config);
  }

  public async bootstrap(
    user: AuthenticatedUser,
    body: unknown,
    traceId: string,
  ): Promise<unknown> {
    const input = bootstrapRequestSchema.parse(bootstrapBody(body));
    let bundle = await this.repository.findHouseholdForSubject(user.uid);
    if (!isSeedBundle(bundle)) {
      bundle = createSeedBundle(user.uid);
      await this.repository.saveBundle(bundle);
    }
    const selectedProfileId = input.selectedProfileId;
    if (selectedProfileId && !bundle.record.profileIds.includes(selectedProfileId)) {
      throw new BadRequestException('selectedProfileId is not part of this household.');
    }
    if (selectedProfileId && selectedProfileId !== bundle.selectedProfileId) {
      bundle = {
        ...bundle,
        selectedProfileId,
        updatedAt: new Date().toISOString(),
      };
      await this.repository.saveBundle(bundle);
    }
    return this.bootstrapResponse(bundle, traceId);
  }

  public async getProfile(user: AuthenticatedUser, profileId: string): Promise<unknown> {
    const { bundle, profile } = await this.requireProfile(user, profileId);
    return this.profileResponse(bundle.record, profile);
  }

  public async updateConstitution(
    user: AuthenticatedUser,
    profileId: string,
    body: unknown,
    traceId: string,
  ): Promise<unknown> {
    const input = parseOrBadRequest(constitutionRequestSchema.parse(body));
    const { bundle, profile } = await this.requireProfile(user, profileId);
    const now = new Date().toISOString();
    const constitution = constitutionUpdateRequestSchema.parse(input);
    const updatedConstitution: ConstitutionRecord = {
      ...constitution,
      constitutionId: profile.constitution.constitutionId,
      profileId,
      version: profile.constitution.version + 1,
      updatedAt: now,
    };
    const event = makeEvent(profile, bundle.record.householdId, 'constitution_updated', now, {
      payload: { constitutionVersion: updatedConstitution.version },
      language: profile.record.preferredLanguage,
      modality: 'explanation',
    });
    const updated: PersistedProfile = {
      ...profile,
      record: {
        ...profile.record,
        constitutionVersion: updatedConstitution.version,
        updatedAt: now,
      },
      constitution: updatedConstitution,
      events: [...profile.events, event],
      updatedAt: now,
    };
    await this.repository.saveProfile(bundle.record.householdId, updated);
    return { profile: this.profileResponse(bundle.record, updated), traceId };
  }

  public async diagnostic(
    user: AuthenticatedUser,
    profileId: string,
    body: unknown,
    traceId: string,
  ): Promise<unknown> {
    const input = parseOrBadRequest(diagnosticRequestSchema.parse(body));
    const { bundle, profile } = await this.requireProfile(user, profileId);
    const now = new Date().toISOString();
    const selectedChoiceId = mapChoice(input.choiceId);
    const safeChoiceId = 'pause-verify';
    if (!selectedChoiceId) throw new BadRequestException('Unknown diagnostic choice.');
    const correct = selectedChoiceId === safeChoiceId;
    const highConfidence = input.confidence >= 0.7;
    const quadrant =
      `${correct ? 'correct' : 'incorrect'}_${highConfidence ? 'confident' : 'uncertain'}` as const;
    const event = makeEvent(profile, bundle.record.householdId, 'diagnostic_answered', now, {
      conceptIds: ['money_in_vs_money_out', 'independent_verification'],
      activityId: 'diagnostic-payment-direction',
      language: profile.record.preferredLanguage,
      modality: 'diagnostic',
      correct,
      confidence: input.confidence,
      responseTimeMs: input.responseTimeMs,
      payload: { assessmentId: `assessment-${randomUUID()}`, selectedChoiceId },
    });
    const observation: Observation = {
      profileId,
      conceptId: 'money_in_vs_money_out',
      eventId: event.eventId,
      correct,
      confidence: input.confidence,
      responseTimeMs: input.responseTimeMs,
      hintsUsed: 0,
      transfer: false,
      timestamp: now,
    };
    const misconceptionUpdate = updateMisconception(profile, observation, event.eventId, !correct);
    const prior =
      profile.states['money_in_vs_money_out'] ??
      unassessedState(profileId, 'money_in_vs_money_out');
    const after = applyObservation(prior, observation, misconceptionUpdate.severity);
    const state = learnerStateSchema.parse(after);
    const transitionEvent = makeEvent(
      profile,
      bundle.record.householdId,
      'concept_state_updated',
      now,
      {
        conceptIds: ['money_in_vs_money_out'],
        activityId: 'diagnostic-payment-direction',
        language: profile.record.preferredLanguage,
        modality: 'diagnostic',
        payload: { transitionId: randomUUID(), formulaVersion: FORMULA_VERSION },
      },
    );
    const misconceptionEvents = !correct
      ? [
          makeEvent(profile, bundle.record.householdId, 'misconception_created', now, {
            conceptIds: ['money_in_vs_money_out'],
            activityId: 'diagnostic-payment-direction',
            language: profile.record.preferredLanguage,
            modality: 'diagnostic',
            payload: {
              misconceptionId: 'pin_needed_to_receive_money',
              severity: misconceptionUpdate.severity,
            },
          }),
        ]
      : [];
    const events = [...profile.events, event, transitionEvent, ...misconceptionEvents];
    const seededProfile: PersistedProfile = {
      ...profile,
      states: { ...profile.states, money_in_vs_money_out: state },
      misconceptions: misconceptionUpdate.profileMisconceptions,
      events,
      updatedAt: now,
    };
    const route = makeRecommendation(
      seededProfile,
      now,
      events.slice(-5).map((item) => item.eventId),
    );
    const recommendation = recommendationSchema.parse(route.recommendation);
    const scaffold = scaffoldRecommendationSchema.parse(route.scaffold);
    const review = reviewScheduleSchema.parse(
      makeReview(profileId, 'money_in_vs_money_out', state, [event.eventId], now),
    );
    const completedEvent = makeEvent(
      profile,
      bundle.record.householdId,
      'diagnostic_completed',
      now,
      {
        conceptIds: ['money_in_vs_money_out'],
        activityId: 'diagnostic-payment-direction',
        language: profile.record.preferredLanguage,
        modality: 'diagnostic',
        payload: { diagnosticId: 'diagnostic-payment-direction', score: correct ? 1 : 0 },
      },
    );
    const recommendedEvent = makeEvent(
      profile,
      bundle.record.householdId,
      'activity_recommended',
      now,
      {
        conceptIds: ['money_in_vs_money_out', 'independent_verification'],
        activityId: 'lesson-payment-direction',
        language: profile.record.preferredLanguage,
        modality: 'lesson',
        payload: {
          recommendationId: recommendation.recommendationId,
          route: recommendation.recommendedRoute,
          scaffoldLevel: recommendation.selectedScaffoldLevel,
        },
      },
    );
    const finalProfile: PersistedProfile = {
      ...seededProfile,
      reviews: [...seededProfile.reviews, review],
      events: [...events, completedEvent, recommendedEvent],
      recommendation,
      scaffold,
      selectedRoute: recommendation.recommendedRoute,
      selectedScaffoldLevel: recommendation.selectedScaffoldLevel,
      updatedAt: now,
    };
    await this.repository.saveProfile(bundle.record.householdId, finalProfile);
    return {
      traceId,
      assessment: { correct, quadrant, choiceId: selectedChoiceId, confidence: input.confidence },
      state,
      misconception:
        finalProfile.misconceptions.find((item) => item.conceptId === 'money_in_vs_money_out') ??
        null,
      recommendation,
      scaffold,
      review,
      scenario: this.scenarioResponse(BASE_SCENARIO_ID, profile.record.preferredLanguage),
    };
  }

  public async explanation(
    user: AuthenticatedUser,
    profileId: string,
    body: unknown,
    traceId: string,
  ): Promise<unknown> {
    const input = parseOrBadRequest(explanationRequestSchema.parse(body));
    const { bundle, profile } = await this.requireProfile(user, profileId);
    const now = new Date().toISOString();
    const recommendation =
      profile.recommendation ??
      makeRecommendation(
        profile,
        now,
        profile.events.slice(-5).map((event) => event.eventId),
      ).recommendation;
    const forceFailure = Boolean(input.forceFailure) && this.canForceFailure(user);
    const result = await this.vertex.adaptExplanation({
      profileId,
      conceptIds: ['money_in_vs_money_out', 'independent_verification'],
      invariantIds: [
        'inv-money-direction-01',
        'inv-independent-verification-01',
        'inv-appearance-01',
      ],
      rubricId: 'rubric_money_direction_v1',
      language: profile.constitution.preferredLanguages[0] ?? profile.record.preferredLanguage,
      route: recommendation.recommendedRoute,
      scaffoldLevel: profile.scaffold?.selectedLevel ?? recommendation.selectedScaffoldLevel,
      traceId,
      forceFailure,
      now,
    });
    const startedEvent = makeEvent(profile, bundle.record.householdId, 'model_call_started', now, {
      conceptIds: ['money_in_vs_money_out', 'independent_verification'],
      activityId: result.lesson.lessonId,
      language: profile.record.preferredLanguage,
      modality: 'explanation',
      payload: {
        feature: 'adaptive_explanation',
        provider: 'vertex-ai',
        model: result.evidence.model,
        requestId: result.evidence.requestId,
      },
    });
    const completedEvent = makeEvent(
      profile,
      bundle.record.householdId,
      'model_call_completed',
      now,
      {
        conceptIds: ['money_in_vs_money_out', 'independent_verification'],
        activityId: result.lesson.lessonId,
        language: profile.record.preferredLanguage,
        modality: 'explanation',
        payload: {
          feature: 'adaptive_explanation',
          provider: 'vertex-ai',
          model: result.evidence.model,
          requestId: result.evidence.requestId,
          generationMode: result.evidence.generationMode,
        },
      },
    );
    const fallbackEvent =
      result.evidence.generationMode === 'curated_fallback'
        ? makeEvent(profile, bundle.record.householdId, 'fallback_used', now, {
            conceptIds: ['money_in_vs_money_out', 'independent_verification'],
            activityId: result.lesson.lessonId,
            language: profile.record.preferredLanguage,
            modality: 'explanation',
            payload: { feature: 'adaptive_explanation', reason: result.evidence.failureReason },
          })
        : null;
    const lessonEvent = makeEvent(profile, bundle.record.householdId, 'lesson_started', now, {
      conceptIds: ['money_in_vs_money_out', 'independent_verification'],
      activityId: result.lesson.lessonId,
      language: profile.record.preferredLanguage,
      modality: 'lesson',
      payload: { lessonId: result.lesson.lessonId },
    });
    const updated: PersistedProfile = {
      ...profile,
      events: [
        ...profile.events,
        startedEvent,
        completedEvent,
        ...(fallbackEvent ? [fallbackEvent] : []),
        lessonEvent,
      ],
      evidence: [...profile.evidence, result.evidenceRecord],
      recommendation,
      updatedAt: now,
    };
    await this.repository.saveProfile(bundle.record.householdId, updated);
    return {
      traceId,
      lesson: result.lesson,
      evidence: result.evidence,
      fallbackLabel: result.evidence.generationMode === 'curated_fallback' ? FALLBACK_LABEL : null,
      recommendation,
    };
  }

  public async scenario(
    user: AuthenticatedUser,
    profileId: string,
    body: unknown,
    traceId: string,
  ): Promise<unknown> {
    const input = parseOrBadRequest(scenarioRequestSchema.parse(body));
    const { bundle, profile } = await this.requireProfile(user, profileId);
    const now = new Date().toISOString();
    const scenarioId = input.scenarioId ?? profile.currentScenarioId;
    const authored = scenarioById.get(scenarioId);
    if (
      !authored ||
      (scenarioId !== BASE_SCENARIO_ID && !profile.scenarioIds.includes(scenarioId))
    ) {
      throw new BadRequestException('Scenario is not available for this profile.');
    }
    const safety = validateScenarioSafety(authored);
    if (!safety.safe) throw new BadRequestException('Scenario failed the safety policy.');
    const scenario = contractScenarios.find((candidate) => candidate.scenarioId === scenarioId);
    if (!scenario) throw new NotFoundException('Scenario not found.');
    const selectedChoiceId = mapChoice(input.choiceId);
    if (!selectedChoiceId || !scenario.choices.some((choice) => choice.id === selectedChoiceId)) {
      throw new BadRequestException('Unknown scenario choice.');
    }
    const correct = selectedChoiceId === scenario.safestChoiceId;
    const transfer = authored.kind === 'transfer';
    const event = makeEvent(profile, bundle.record.householdId, 'scenario_answered', now, {
      conceptIds: ['money_in_vs_money_out', 'independent_verification'],
      activityId: scenarioId,
      language: profile.record.preferredLanguage,
      modality: transfer ? 'transfer' : 'simulation',
      correct,
      confidence: input.confidence,
      responseTimeMs: input.responseTimeMs,
      payload: { scenarioId, choiceId: selectedChoiceId },
    });
    const observation: Observation = {
      profileId,
      conceptId: 'money_in_vs_money_out',
      eventId: event.eventId,
      correct,
      confidence: input.confidence,
      responseTimeMs: input.responseTimeMs,
      hintsUsed: 0,
      transfer,
      timestamp: now,
    };
    const misconceptionUpdate = updateMisconception(profile, observation, event.eventId, !correct);
    const prior =
      profile.states['money_in_vs_money_out'] ??
      unassessedState(profileId, 'money_in_vs_money_out');
    const after = learnerStateSchema.parse(
      applyObservation(prior, observation, misconceptionUpdate.severity),
    );
    const stateEvent = makeEvent(profile, bundle.record.householdId, 'concept_state_updated', now, {
      conceptIds: ['money_in_vs_money_out'],
      activityId: scenarioId,
      language: profile.record.preferredLanguage,
      modality: transfer ? 'transfer' : 'simulation',
      payload: { transitionId: randomUUID(), formulaVersion: FORMULA_VERSION },
    });
    const transferEvent = transfer
      ? makeEvent(
          profile,
          bundle.record.householdId,
          correct ? 'transfer_succeeded' : 'transfer_failed',
          now,
          {
            conceptIds: ['money_in_vs_money_out'],
            activityId: scenarioId,
            language: profile.record.preferredLanguage,
            modality: 'transfer',
            correct,
            confidence: input.confidence,
            responseTimeMs: input.responseTimeMs,
            payload: { transferId: scenarioId },
          },
        )
      : null;
    const currentIndex = profile.scenarioIds.indexOf(scenarioId);
    const nextTransfer = transfer
      ? (profile.scenarioIds[currentIndex + 1] ?? null)
      : (profile.scenarioIds[0] ?? null);
    const seededProfile: PersistedProfile = {
      ...profile,
      states: { ...profile.states, money_in_vs_money_out: after },
      misconceptions: misconceptionUpdate.profileMisconceptions,
      currentScenarioId: transfer ? scenarioId : BASE_SCENARIO_ID,
      currentTransferScenarioId: nextTransfer,
      events: [...profile.events, event, stateEvent, ...(transferEvent ? [transferEvent] : [])],
      updatedAt: now,
    };
    const route = makeRecommendation(
      seededProfile,
      now,
      seededProfile.events.slice(-5).map((item) => item.eventId),
    );
    const recommendation = recommendationSchema.parse(route.recommendation);
    const review = reviewScheduleSchema.parse(
      makeReview(
        profileId,
        'money_in_vs_money_out',
        after,
        [event.eventId],
        now,
        transfer ? 'transfer' : 'familiar_application',
      ),
    );
    const finalProfile: PersistedProfile = {
      ...seededProfile,
      reviews: [...seededProfile.reviews, review],
      recommendation,
      scaffold: scaffoldRecommendationSchema.parse(route.scaffold),
      selectedRoute: recommendation.recommendedRoute,
      selectedScaffoldLevel: recommendation.selectedScaffoldLevel,
      updatedAt: now,
    };
    await this.repository.saveProfile(bundle.record.householdId, finalProfile);
    return {
      traceId,
      scenario: this.scenarioResponse(scenarioId, profile.record.preferredLanguage),
      result: {
        correct,
        selectedChoiceId,
        transfer,
        feedback:
          authored.choices.find((choice) => choice.id === selectedChoiceId)?.feedback[
            profile.record.preferredLanguage
          ] ?? authored.choices.find((choice) => choice.id === selectedChoiceId)?.feedback.en,
      },
      state: after,
      misconception:
        finalProfile.misconceptions.find((item) => item.conceptId === 'money_in_vs_money_out') ??
        null,
      recommendation,
      nextScenario: nextTransfer
        ? this.scenarioResponse(nextTransfer, profile.record.preferredLanguage)
        : null,
      review,
    };
  }

  public async teachBack(
    user: AuthenticatedUser,
    profileId: string,
    body: unknown,
    traceId: string,
  ): Promise<unknown> {
    const input = parseOrBadRequest(teachBackRequestSchema.parse(body));
    const { bundle, profile } = await this.requireProfile(user, profileId);
    const now = new Date().toISOString();
    const teachBackId = `teachback-${randomUUID()}`;
    const forceFailure = Boolean(input.forceFailure) && this.canForceFailure(user);
    const result = await this.vertex.extractTeachBack({
      teachBackId,
      profileId,
      conceptId: 'money_in_vs_money_out',
      rubricId: 'rubric_money_direction_v1',
      text: input.text,
      language: profile.constitution.preferredLanguages[0] ?? profile.record.preferredLanguage,
      traceId,
      forceFailure,
      now,
    });
    const submittedEvent = makeEvent(
      profile,
      bundle.record.householdId,
      'teachback_submitted',
      now,
      {
        conceptIds: ['money_in_vs_money_out'],
        activityId: teachBackId,
        language: profile.record.preferredLanguage,
        modality: 'teach_back',
        payload: { teachBackId },
      },
    );
    const claimCount =
      result.output.correctClaims.length +
      result.output.partialClaims.length +
      result.output.misconceptions.length;
    const correct =
      result.output.correctClaims.length >= 1 && result.output.misconceptions.length === 0;
    const confidence = correct ? 0.7 : 0.3;
    const observation: Observation = {
      profileId,
      conceptId: 'money_in_vs_money_out',
      eventId: submittedEvent.eventId,
      correct,
      confidence,
      responseTimeMs: 0,
      hintsUsed: 0,
      transfer: false,
      timestamp: now,
    };
    const misconceptionUpdate = updateMisconception(
      profile,
      observation,
      submittedEvent.eventId,
      !correct,
    );
    const previous =
      profile.states['money_in_vs_money_out'] ??
      unassessedState(profileId, 'money_in_vs_money_out');
    const after = learnerStateSchema.parse(
      applyObservation(previous, observation, misconceptionUpdate.severity),
    );
    const evaluatedEvent = makeEvent(
      profile,
      bundle.record.householdId,
      'teachback_evaluated',
      now,
      {
        conceptIds: ['money_in_vs_money_out'],
        activityId: teachBackId,
        language: profile.record.preferredLanguage,
        modality: 'teach_back',
        correct,
        confidence,
        payload: { teachBackId, misconceptionCount: result.output.misconceptions.length },
      },
    );
    const stateEvent = makeEvent(profile, bundle.record.householdId, 'concept_state_updated', now, {
      conceptIds: ['money_in_vs_money_out'],
      activityId: teachBackId,
      language: profile.record.preferredLanguage,
      modality: 'teach_back',
      payload: { transitionId: randomUUID(), formulaVersion: FORMULA_VERSION },
    });
    const completedModelEvent = makeEvent(
      profile,
      bundle.record.householdId,
      'model_call_completed',
      now,
      {
        conceptIds: ['money_in_vs_money_out'],
        activityId: teachBackId,
        language: profile.record.preferredLanguage,
        modality: 'teach_back',
        payload: {
          feature: 'teach_back_extraction',
          provider: 'vertex-ai',
          model: result.evidence.model,
          requestId: result.evidence.requestId,
          generationMode: result.evidence.generationMode,
        },
      },
    );
    const fallbackEvent =
      result.evidence.generationMode === 'curated_fallback'
        ? makeEvent(profile, bundle.record.householdId, 'fallback_used', now, {
            conceptIds: ['money_in_vs_money_out'],
            activityId: teachBackId,
            language: profile.record.preferredLanguage,
            modality: 'teach_back',
            payload: { feature: 'teach_back_extraction', reason: result.evidence.failureReason },
          })
        : null;
    const seededProfile: PersistedProfile = {
      ...profile,
      states: { ...profile.states, money_in_vs_money_out: after },
      misconceptions: misconceptionUpdate.profileMisconceptions,
      events: [
        ...profile.events,
        submittedEvent,
        evaluatedEvent,
        stateEvent,
        completedModelEvent,
        ...(fallbackEvent ? [fallbackEvent] : []),
      ],
      evidence: [...profile.evidence, result.evidenceRecord],
      updatedAt: now,
    };
    const route = makeRecommendation(
      seededProfile,
      now,
      seededProfile.events.slice(-5).map((event) => event.eventId),
    );
    const review = reviewScheduleSchema.parse(
      makeReview(
        profileId,
        'money_in_vs_money_out',
        after,
        [submittedEvent.eventId],
        now,
        'explanation',
      ),
    );
    const finalProfile: PersistedProfile = {
      ...seededProfile,
      reviews: [...seededProfile.reviews, review],
      recommendation: recommendationSchema.parse(route.recommendation),
      scaffold: scaffoldRecommendationSchema.parse(route.scaffold),
      selectedRoute: route.recommendation.recommendedRoute,
      selectedScaffoldLevel: route.recommendation.selectedScaffoldLevel,
      updatedAt: now,
    };
    await this.repository.saveProfile(bundle.record.householdId, finalProfile);
    return {
      traceId,
      output: result.output,
      evidence: result.evidence,
      fallbackLabel: result.evidence.generationMode === 'curated_fallback' ? FALLBACK_LABEL : null,
      state: after,
      misconception:
        finalProfile.misconceptions.find((item) => item.conceptId === 'money_in_vs_money_out') ??
        null,
      review,
      recommendation: finalProfile.recommendation,
      analysis: { correct, claimCount },
    };
  }

  public async dashboard(
    user: AuthenticatedUser,
    profileId: string,
    traceId: string,
  ): Promise<unknown> {
    const { bundle, profile } = await this.requireProfile(user, profileId);
    const now = new Date().toISOString();
    const metrics = deriveMetrics(profile, bundle.record.householdId, now);
    const state =
      profile.states['money_in_vs_money_out'] ??
      unassessedState(profileId, 'money_in_vs_money_out');
    const observationCount = profile.events.filter(
      (event) =>
        event.eventName === 'diagnostic_answered' ||
        event.eventName === 'scenario_answered' ||
        event.eventName === 'teachback_evaluated',
    ).length;
    const recallEstimate =
      observationCount >= 2 && state.status === 'assessed' && state.lastPractisedAt
        ? {
            label: 'Estimated recall, not a guarantee',
            profileId,
            conceptId: 'money_in_vs_money_out',
            estimatedRecall: Math.max(
              0,
              Math.min(
                1,
                Math.exp(
                  -(Date.now() - Date.parse(state.lastPractisedAt)) /
                    (state.memoryStabilityDays * 86_400_000),
                ),
              ),
            ),
            modelVersion: FORMULA_VERSION,
            stabilityEstimateDays: state.memoryStabilityDays,
            elapsedDays: Math.max(0, (Date.now() - Date.parse(state.lastPractisedAt)) / 86_400_000),
            observationCount,
            expectedReviewSchedule: profile.reviews.slice(-5).map((review) => review.nextReviewAt),
            generatedAt: now,
          }
        : null;
    return {
      traceId,
      seededLabel: profile.events.length === 0 ? SEEDED_STATE_LABEL : null,
      profile: this.profileResponse(bundle.record, profile),
      states: Object.values(profile.states),
      misconceptions: profile.misconceptions,
      reviews: profile.reviews,
      memoryRadar: {
        estimate: recallEstimate,
        assumptions:
          'Estimate uses recorded practice, correctness, confidence, stability, and scheduled reviews.',
      },
      recommendation: profile.recommendation,
      scaffold: profile.scaffold,
      scenario: this.scenarioResponse(profile.currentScenarioId, profile.record.preferredLanguage),
      evidence: profile.evidence,
      analytics: metrics,
      events: profile.events.map((event) => ({
        eventId: event.eventId,
        eventName: event.eventName,
        occurredAt: event.occurredAt,
        conceptIds: event.conceptIds,
        modality: event.modality,
      })),
    };
  }

  public async resetEvaluator(user: AuthenticatedUser, traceId: string): Promise<unknown> {
    if (!this.canForceFailure(user) || !this.environment.ENABLE_EVALUATOR_CONTROLS) {
      throw new ForbiddenException('Evaluator controls are not enabled for this account.');
    }
    const bundle = createSeedBundle(user.uid);
    await this.repository.resetSubject(user.uid, bundle);
    return { bootstrap: this.bootstrapResponse(bundle, traceId), reset: true };
  }

  private async requireProfile(
    user: AuthenticatedUser,
    profileId: string,
  ): Promise<{ readonly bundle: HouseholdBundle; readonly profile: PersistedProfile }> {
    const bundle = await this.repository.findHouseholdForSubject(user.uid);
    if (!bundle || bundle.record.ownerSubjectId !== user.uid || bundle.record.status !== 'active') {
      throw new ForbiddenException('The authenticated account is not a household member.');
    }
    if (!bundle.record.profileIds.includes(profileId))
      throw new ForbiddenException('The profile is not owned by this household.');
    const profile = await this.repository.getProfile(bundle.record.householdId, profileId);
    if (
      !profile ||
      profile.record.householdId !== bundle.record.householdId ||
      profile.record.status !== 'active'
    ) {
      throw new NotFoundException('Profile not found.');
    }
    return { bundle, profile };
  }

  private canForceFailure(user: AuthenticatedUser): boolean {
    return user.isEvaluator && this.environment.ENABLE_EVALUATOR_CONTROLS;
  }

  private bootstrapResponse(bundle: HouseholdBundle, traceId: string): unknown {
    const profiles = Object.values(bundle.profiles).map((profile) => this.profileSummary(profile));
    const selected = bundle.profiles[bundle.selectedProfileId] ?? Object.values(bundle.profiles)[0];
    return {
      traceId,
      household: bundle.record,
      seededLabel: 'Evaluator test account',
      profiles,
      selectedProfileId: selected?.record.profileId ?? bundle.selectedProfileId,
      selectedProfile: selected ? this.profileResponse(bundle.record, selected) : null,
      scenario: selected
        ? this.scenarioResponse(selected.currentScenarioId, selected.record.preferredLanguage)
        : null,
      dashboard: selected
        ? {
            states: Object.values(selected.states),
            misconceptions: selected.misconceptions,
            reviews: selected.reviews,
            evidence: selected.evidence,
            seededLabel: SEEDED_STATE_LABEL,
          }
        : null,
    };
  }

  private profileResponse(household: HouseholdRecord, profile: PersistedProfile): unknown {
    return {
      ...profile.record,
      constitution: profile.constitution,
      scenarioIds: profile.scenarioIds,
      currentScenarioId: profile.currentScenarioId,
      currentTransferScenarioId: profile.currentTransferScenarioId,
      states: Object.values(profile.states),
      misconceptions: profile.misconceptions,
      reviews: profile.reviews,
      recommendation: profile.recommendation,
      scaffold: profile.scaffold,
      selectedRoute: profile.selectedRoute,
      selectedScaffoldLevel: profile.selectedScaffoldLevel,
      evidence: profile.evidence,
      learnerDataControls: {
        canInspect: true,
        canExport: true,
        canResetConcept: true,
        canDisablePersonalizationSignals: true,
      },
      householdId: household.householdId,
    };
  }

  private profileSummary(profile: PersistedProfile): unknown {
    return {
      ...profile.record,
      constitution: profile.constitution,
      seededLabel: profile.record.seededLabel,
      stateStatus: Object.values(profile.states).every((state) => state.status === 'unassessed')
        ? 'unassessed'
        : 'assessed',
    };
  }

  private scenarioResponse(
    scenarioId: string,
    language: ProfileRecord['preferredLanguage'],
  ): unknown {
    const scenario =
      contractScenarios.find((candidate) => candidate.scenarioId === scenarioId) ??
      contractScenarios.find((candidate) => candidate.scenarioId === BASE_SCENARIO_ID);
    const authored = scenarioById.get(scenario?.scenarioId ?? BASE_SCENARIO_ID);
    if (!scenario || !authored) return null;
    const localized = profileCopy['profile-savita'];
    return {
      scenario,
      kind: authored.kind,
      visual: authored.visual,
      language,
      title: authored.title[language],
      prompt: authored.prompt[language],
      choices: authored.choices.map((choice) => ({
        id: choice.id,
        text: choice.text[language],
        classification: choice.classification,
      })),
      trainingLabel: 'TRAINING SIMULATION',
      constraints: authored.constraints,
      copy: {
        trainingSimulation: localized.trainingSimulation,
        noActiveLinks: localized.noActiveLinks,
      },
    };
  }
}

function deriveMetrics(
  profile: PersistedProfile,
  householdId: string,
  now: string,
): readonly AnalyticsMetric[] {
  const events = profile.events;
  const attempted = events.filter(
    (event) =>
      event.eventName === 'scenario_answered' ||
      event.eventName === 'diagnostic_answered' ||
      event.eventName === 'teachback_evaluated',
  );
  const correct = attempted.filter((event) => event.correct === true);
  const transfers = events.filter(
    (event) => event.eventName === 'transfer_succeeded' || event.eventName === 'transfer_failed',
  );
  const transferSuccesses = events.filter((event) => event.eventName === 'transfer_succeeded');
  const misconceptionEvents = events.filter(
    (event) =>
      event.eventName === 'misconception_created' || event.eventName === 'misconception_updated',
  );
  const confidenceEvents = attempted.filter((event) => event.confidence !== undefined);
  const hints = attempted.reduce((sum, event) => sum + (event.hintsUsed ?? 0), 0);
  const metrics: Array<AnalyticsMetric> = [];
  metrics.push(
    metric(
      'verified-concept-state-gain',
      'verified_concept_state_gain',
      householdId,
      Math.min(1, correct.length / Math.max(1, attempted.length)),
      attempted.length,
      ['diagnostic_answered', 'scenario_answered', 'teachback_evaluated'],
      now,
    ),
  );
  metrics.push(
    metric(
      'delayed-retrieval-success',
      'delayed_retrieval_success',
      householdId,
      0,
      0,
      ['review_completed'],
      now,
    ),
  );
  metrics.push(
    metric(
      'transfer-success',
      'transfer_success',
      householdId,
      transferSuccesses.length / Math.max(1, transfers.length),
      transfers.length,
      ['transfer_succeeded', 'transfer_failed'],
      now,
    ),
  );
  metrics.push(
    metric(
      'misconception-recurrence',
      'misconception_recurrence',
      householdId,
      misconceptionEvents.length > 0
        ? Math.min(1, Math.max(0, misconceptionEvents.length - 1) / misconceptionEvents.length)
        : 0,
      misconceptionEvents.length,
      ['misconception_created', 'misconception_updated'],
      now,
    ),
  );
  const calibration =
    confidenceEvents.length === 0
      ? 0
      : confidenceEvents.reduce(
          (sum, event) => sum + (event.correct === event.confidence! >= 0.7 ? 1 : 0),
          0,
        ) / confidenceEvents.length;
  metrics.push(
    metric(
      'confidence-calibration',
      'confidence_calibration',
      householdId,
      calibration,
      confidenceEvents.length,
      ['confidence_submitted', 'diagnostic_answered', 'scenario_answered'],
      now,
    ),
  );
  metrics.push(
    metric(
      'hint-dependence',
      'hint_dependence',
      householdId,
      attempted.length === 0 ? 0 : Math.min(1, hints / (attempted.length * 2)),
      attempted.length,
      ['hint_requested', 'scenario_answered', 'teachback_evaluated'],
      now,
    ),
  );
  return metrics;
}

function metric(
  id: string,
  name: AnalyticsMetric['name'],
  householdId: string,
  value: number,
  sampleSize: number,
  derivedFromEventNames: AnalyticsMetric['derivedFromEventNames'],
  lastUpdatedAt: string,
): AnalyticsMetric {
  return {
    metricId: id,
    name,
    householdId,
    value: Math.max(0, Math.min(1, value)),
    sampleSize,
    derivedFromEventNames,
    lastUpdatedAt,
    emptyState: sampleSize === 0,
    seeded: false,
  };
}

function makeEvent(
  profile: PersistedProfile,
  tenantId: string,
  eventName: AnalyticsEvent['eventName'],
  now: string,
  fields: {
    readonly payload?: Record<string, unknown>;
    readonly conceptIds?: readonly string[];
    readonly activityId?: string;
    readonly language?: ProfileRecord['preferredLanguage'];
    readonly modality?:
      | 'diagnostic'
      | 'lesson'
      | 'simulation'
      | 'transfer'
      | 'teach_back'
      | 'retrieval'
      | 'explanation';
    readonly correct?: boolean;
    readonly confidence?: number;
    readonly responseTimeMs?: number;
  },
): AnalyticsEvent {
  return analyticsEventSchema.parse({
    eventId: randomUUID(),
    occurredAt: now,
    tenantId,
    profileId: profile.record.profileId,
    sessionId: `session-${profile.record.profileId}`,
    conceptIds: fields.conceptIds ? [...fields.conceptIds] : undefined,
    activityId: fields.activityId,
    language: fields.language,
    modality: fields.modality,
    correct: fields.correct,
    confidence: fields.confidence,
    responseTimeMs: fields.responseTimeMs,
    schemaVersion: '1.0',
    metadata: {},
    eventName,
    payload: fields.payload,
  });
}

function mapChoice(choiceId: string): string | undefined {
  const mapping: Readonly<Record<string, string>> = {
    'wrong-payment': 'approve-now',
    'safe-payment': 'pause-verify',
    'approve-now': 'approve-now',
    'pause-verify': 'pause-verify',
  };
  return mapping[choiceId];
}

function bootstrapBody(value: unknown): unknown {
  if (value === undefined || value === null) return {};
  return value;
}

function parseOrBadRequest<T>(value: T): T {
  return value;
}
