import { describe, expect, it } from "vitest";
import {
  accountCreatedEventSchema,
  activityRecommendedEventSchema,
  analyticsEventNameSchema,
  analyticsEventSchema,
  analyticsMetricSchema,
  apiErrorEnvelopeSchema,
  assessmentRecordSchema,
  assessmentRequestSchema,
  authorizationSubjectSchema,
  conceptGraphSchema,
  conceptSchema,
  consentRecordSchema,
  constitutionRecordSchema,
  eventSchema,
  fallbackAiEvidenceSchema,
  fallbackContentSchema,
  graphEdgeSchema,
  householdRecordSchema,
  idempotencyRecordSchema,
  invariantRecordSchema,
  learnerOverrideRecordSchema,
  learnerOverrideRequestSchema,
  learnerStateSchema,
  learningConstitutionSchema,
  liveAiEvidenceSchema,
  misconceptionSchema,
  parseContract,
  profilePatchRequestSchema,
  profileRecordSchema,
  publicRuntimeConfigSchema,
  recallEstimateSchema,
  recommendationSchema,
  reviewScheduleSchema,
  rubricSchema,
  safeParseContract,
  safeScenarioSchema,
  scenarioDeliverySchema,
  scaffoldRecommendationSchema,
  stateTransitionEvidenceSchema,
  teachBackOutputSchema,
  teachBackRequestSchema,
  transferScenarioSchema,
  type AnalyticsEvent
} from "../src/index.js";

const timestamp = "2026-08-22T06:30:00Z";
const laterTimestamp = "2026-08-23T06:30:00Z";

const validConstitution = {
  goal: "Recognize and safely respond to common digital manipulation",
  deadline: null,
  sessionMinutes: 7,
  interfaceMode: "standard",
  preferredLanguages: ["hi", "en"],
  readingComplexity: "simple",
  explanationDepth: "conceptual",
  challengePreference: "gentle",
  relevantContexts: ["pension", "messaging", "upi"],
  allowVoiceProcessing: false,
  allowCrossSessionPersonalization: true,
  allowReminderNotifications: false,
  personalizationSignals: {
    correctness: true,
    confidence: true,
    responseTime: true,
    hintUse: true,
    teachBack: true,
    transfer: true
  },
  accessibility: {
    keyboardOnly: false,
    reducedMotion: true,
    captions: true,
    textSize: "large",
    highContrast: false,
    screenReaderOptimized: false
  }
} as const;

const validScenario = {
  scenarioId: "scenario-payment-001",
  trainingLabel: "TRAINING SIMULATION",
  title: "Payment direction decision",
  conceptIds: ["money_in_vs_money_out"],
  invariantIds: ["inv-money-direction"],
  context: "small_business",
  channel: "fictional_chat",
  manipulationPatterns: ["urgency", "authority"],
  unsafeRequestCategory: "authorize_outgoing_action",
  prompt: "A fictional support representative asks you to approve an action immediately.",
  choices: [
    { id: "a", text: "Approve immediately", classification: "unsafe" },
    { id: "b", text: "Pause and verify through an independent channel", classification: "safe" },
    { id: "c", text: "Close the conversation and seek help", classification: "safe" }
  ],
  safestChoiceId: "b",
  feedbackRubricId: "rubric-independent-verification-v1",
  transferScenarioIds: ["scenario-job-014"],
  constraints: {
    activeLinks: false,
    realOrganizations: false,
    realPhoneNumbers: false,
    realCredentials: false,
    operationalFraudInstructions: false
  }
} as const;

const eventBase = {
  eventId: "event-101",
  occurredAt: timestamp,
  tenantId: "household-bharat",
  profileId: "profile-savita",
  sessionId: "session-1",
  conceptIds: ["money_in_vs_money_out"],
  activityId: "scenario-payment-001",
  language: "hi",
  modality: "simulation",
  correct: false,
  confidence: 0.9,
  responseTimeMs: 8200,
  hintsUsed: 0,
  schemaVersion: "1.0",
  metadata: {}
} as const;

describe("shared primitives and safe parsing", () => {
  it("round-trips a valid value and returns typed safe parse results", () => {
    const parsed = parseContract(learnerStateSchema, {
      profileId: "profile-savita",
      conceptId: "money_in_vs_money_out",
      status: "unassessed",
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
      evidenceEventIds: [],
      stateLabel: "Unknown"
    });
    expect(parsed.status).toBe("unassessed");
    expect(safeParseContract(learnerStateSchema, { status: "bad" }).success).toBe(false);
    expect(() => parseContract(learnerStateSchema, { status: "bad" })).toThrow("Contract validation failed");
  });

  it("rejects malformed opaque IDs, out-of-range scores, and extra fields", () => {
    expect(safeParseContract(learnerStateSchema, {
      profileId: "bad id",
      conceptId: "c",
      status: "unassessed",
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
      evidenceEventIds: [],
      stateLabel: "Unknown",
      extra: true
    }).success).toBe(false);
  });
});

describe("authorization, API errors, and public config", () => {
  const subject = {
    subjectId: "subject-evaluator",
    tenantId: "household-bharat",
    roles: ["evaluator"],
    profileIds: ["profile-savita", "profile-arjun"],
    authenticatedAt: timestamp
  } as const;

  it("accepts a scoped subject and rejects duplicate role/profile claims", () => {
    expect(authorizationSubjectSchema.safeParse(subject).success).toBe(true);
    expect(authorizationSubjectSchema.safeParse({ ...subject, roles: ["evaluator", "evaluator"] }).success).toBe(false);
    expect(authorizationSubjectSchema.safeParse({ ...subject, profileIds: ["profile-savita", "profile-savita"] }).success).toBe(false);
  });

  it("requires the stable API error envelope and strict public config", () => {
    expect(apiErrorEnvelopeSchema.safeParse({
      error: { code: "validation_failed", message: "Invalid confidence", traceId: "trace-1", details: { retryable: false } },
      status: 422
    }).success).toBe(true);
    expect(apiErrorEnvelopeSchema.safeParse({ error: { code: "validation_failed", message: "x", traceId: "t", extra: true }, status: 422 }).success).toBe(false);
    const config = {
      environment: "production",
      appVersion: "0.1.0",
      apiBaseUrl: "https://example.invalid/api",
      supportedLanguages: ["hi", "en"],
      model: { provider: "vertex-ai", modelId: "configured-model", location: "asia-south1", maxOutputTokens: 1_024, timeoutMs: 12_000 },
      featureFlags: { adaptiveExplanation: true, teachBackAnalysis: true, simulator: true, evaluatorControls: true },
      traceSamplingRate: 0.25
    } as const;
    expect(publicRuntimeConfigSchema.safeParse(config).success).toBe(true);
    expect(publicRuntimeConfigSchema.safeParse({ ...config, supportedLanguages: ["hi", "hi"] }).success).toBe(false);
    expect(publicRuntimeConfigSchema.safeParse({ ...config, traceSamplingRate: 1.01 }).success).toBe(false);
  });
});

describe("households, profiles, constitutions, and consent", () => {
  it("keeps persisted records distinct and enforces time ordering", () => {
    const household = {
      householdId: "household-bharat",
      displayName: "Bharat Digital Family",
      ownerSubjectId: "subject-evaluator",
      status: "active",
      profileIds: ["profile-savita", "profile-arjun", "profile-ramesh"],
      seededLabel: "Evaluator test account",
      createdAt: timestamp,
      updatedAt: laterTimestamp
    } as const;
    expect(householdRecordSchema.safeParse(household).success).toBe(true);
    expect(householdRecordSchema.safeParse({ ...household, updatedAt: "2026-08-21T06:30:00Z" }).success).toBe(false);
    expect(householdRecordSchema.safeParse({ ...household, profileIds: ["profile-savita", "profile-savita"] }).success).toBe(false);

    const profile = {
      profileId: "profile-savita",
      householdId: "household-bharat",
      displayName: "Savita",
      ageBand: "56_plus",
      interfaceMode: "standard",
      preferredLanguage: "hi",
      status: "active",
      constitutionVersion: 1,
      seededLabel: "Seeded starting state",
      createdAt: timestamp,
      updatedAt: laterTimestamp
    } as const;
    expect(profileRecordSchema.safeParse(profile).success).toBe(true);
    expect(profileRecordSchema.safeParse({ ...profile, unknownField: "no" }).success).toBe(false);
    expect(profilePatchRequestSchema.safeParse({}).success).toBe(false);
    expect(profilePatchRequestSchema.safeParse({ preferredLanguage: "en" }).success).toBe(true);
  });

  it("validates constitution bounds, consent dependencies, and versioned consent", () => {
    expect(learningConstitutionSchema.safeParse(validConstitution).success).toBe(true);
    const ideaConstitution = { ...validConstitution };
    delete (ideaConstitution as { interfaceMode?: string }).interfaceMode;
    expect(learningConstitutionSchema.safeParse(ideaConstitution).success).toBe(true);
    expect(learningConstitutionSchema.safeParse({ ...validConstitution, sessionMinutes: 2 }).success).toBe(false);
    expect(learningConstitutionSchema.safeParse({ ...validConstitution, preferredLanguages: ["hi", "hi"] }).success).toBe(false);
    expect(learningConstitutionSchema.safeParse({ ...validConstitution, allowCrossSessionPersonalization: false }).success).toBe(false);
    expect(learningConstitutionSchema.safeParse({ ...validConstitution, interfaceMode: "voice_first", allowVoiceProcessing: false }).success).toBe(false);

    const record = { ...validConstitution, constitutionId: "constitution-savita-v1", profileId: "profile-savita", version: 1, updatedAt: timestamp };
    expect(constitutionRecordSchema.safeParse(record).success).toBe(true);
    expect(consentRecordSchema.safeParse({
      consentId: "consent-1",
      profileId: "profile-savita",
      version: 1,
      voiceProcessing: false,
      crossSessionPersonalization: true,
      reminderNotifications: false,
      capturedAt: timestamp,
      withdrawnAt: laterTimestamp
    }).success).toBe(true);
    expect(consentRecordSchema.safeParse({
      consentId: "consent-1",
      profileId: "profile-savita",
      version: 1,
      voiceProcessing: false,
      crossSessionPersonalization: true,
      reminderNotifications: false,
      capturedAt: timestamp,
      withdrawnAt: "2026-08-21T06:30:00Z"
    }).success).toBe(false);
  });
});

describe("curriculum graph and state contracts", () => {
  const invariant = { invariantId: "inv-money-direction", conceptId: "money_in_vs_money_out", statement: "A secret authorization code authorizes an action; it does not prove entitlement to receive money.", safetyCritical: true } as const;
  const concept = {
    conceptId: "money_in_vs_money_out",
    name: "Receiving money versus authorizing payment",
    learningObjective: "Distinguish an incoming transfer from an action that authorizes money to leave an account.",
    invariants: ["A secret authorization code authorizes an action; it does not prove entitlement to receive money."],
    invariantIds: ["inv-money-direction"],
    prerequisites: ["independent_verification"],
    misconceptionIds: ["pin_needed_to_receive_money"],
    contexts: ["upi", "qr", "collect_request", "support_call"],
    riskWeight: 0.95,
    reviewImportance: 0.95,
    rubricId: "rubric-money-direction-v1",
    safetyClassification: "preventive_education"
  } as const;

  it("round-trips concept, invariant, rubric, edge, and graph records", () => {
    expect(invariantRecordSchema.safeParse(invariant).success).toBe(true);
    expect(conceptSchema.safeParse(concept).success).toBe(true);
    expect(conceptSchema.safeParse({ ...concept, prerequisites: ["independent_verification", "independent_verification"] }).success).toBe(false);
    const rubric = {
      rubricId: "rubric-money-direction-v1",
      version: 1,
      conceptId: "money_in_vs_money_out",
      criteria: [{ criterionId: "criterion-1", label: "Identifies outgoing authorization", requiredInvariantIds: ["inv-money-direction"], weight: 1 }],
      passingScore: 0.7
    } as const;
    expect(rubricSchema.safeParse(rubric).success).toBe(true);
    expect(rubricSchema.safeParse({ ...rubric, criteria: [] }).success).toBe(false);
    const edge = { edgeId: "edge-1", sourceConceptId: "pin_authorization", targetConceptId: "money_in_vs_money_out", edgeType: "prerequisite_of" } as const;
    expect(graphEdgeSchema.safeParse(edge).success).toBe(true);
    expect(graphEdgeSchema.safeParse({ ...edge, sourceConceptId: "c", targetConceptId: "c" }).success).toBe(false);
    expect(graphEdgeSchema.safeParse({ ...edge, edgeType: "assessed_by" }).success).toBe(false);
    expect(conceptGraphSchema.safeParse({ graphId: "graph-v1", version: 1, concepts: [concept], invariants: [invariant], rubrics: [rubric], edges: [edge] }).success).toBe(true);
    expect(conceptGraphSchema.safeParse({ graphId: "graph-v1", version: 1, concepts: [concept, concept], invariants: [invariant], rubrics: [rubric], edges: [] }).success).toBe(false);
    expect(conceptGraphSchema.safeParse({ graphId: "graph-v1", version: 1, concepts: [concept], invariants: [invariant, invariant], rubrics: [rubric], edges: [] }).success).toBe(false);
  });

  it("distinguishes unassessed from assessed learner state and enforces bounds", () => {
    const unassessed = {
      profileId: "profile-savita",
      conceptId: "money_in_vs_money_out",
      status: "unassessed",
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
      evidenceEventIds: [],
      stateLabel: "Unknown"
    } as const;
    expect(learnerStateSchema.safeParse(unassessed).success).toBe(true);
    const assessed = {
      profileId: "profile-savita",
      conceptId: "money_in_vs_money_out",
      status: "assessed",
      mastery: 0.32,
      uncertainty: 0.41,
      attempts: 3,
      correctAttempts: 1,
      averageConfidence: 0.83,
      averageResponseTimeMs: 11_200,
      hintsUsed: 1,
      currentScaffoldLevel: 2,
      transferSuccesses: 0,
      transferFailures: 1,
      misconceptionSeverity: 0.88,
      memoryStabilityDays: 1.5,
      lastPractisedAt: timestamp,
      nextReviewAt: laterTimestamp,
      evidenceEventIds: ["event-101", "event-109"],
      stateLabel: "Developing"
    } as const;
    expect(learnerStateSchema.safeParse(assessed).success).toBe(true);
    expect(learnerStateSchema.safeParse({ ...assessed, correctAttempts: 4 }).success).toBe(false);
    expect(learnerStateSchema.safeParse({ ...assessed, transferSuccesses: 3, transferFailures: 1 }).success).toBe(false);
    expect(learnerStateSchema.safeParse({ ...unassessed, status: "assessed" }).success).toBe(false);
  });

  it("checks misconception severity bands and history bounds", () => {
    const misconception = {
      misconceptionRecordId: "misconception-record-1",
      misconceptionId: "pin_needed_to_receive_money",
      profileId: "profile-savita",
      conceptId: "money_in_vs_money_out",
      status: "active",
      severity: 0.88,
      severityBand: "high",
      confidence: 0.9,
      recurrenceCount: 2,
      recurrenceNormalized: 1,
      conceptRisk: 0.95,
      firstDetectedAt: timestamp,
      lastDetectedAt: laterTimestamp,
      evidenceEventIds: ["event-101"],
      correctionInvariantId: "inv-money-direction"
    } as const;
    expect(misconceptionSchema.safeParse(misconception).success).toBe(true);
    expect(misconceptionSchema.safeParse({ ...misconception, severityBand: "low" }).success).toBe(false);
    expect(misconceptionSchema.safeParse({ ...misconception, lastDetectedAt: "2026-08-21T06:30:00Z" }).success).toBe(false);
  });
});

describe("assessment, route, scaffold, and learner control contracts", () => {
  const request = {
    assessmentId: "assessment-1",
    profileId: "profile-savita",
    conceptId: "money_in_vs_money_out",
    activityId: "scenario-payment-001",
    assessmentType: "diagnostic",
    answer: { kind: "choice", choiceId: "a" },
    confidence: 0.9,
    responseTimeMs: 8_200,
    hintsUsed: 0,
    context: "upi",
    submittedAt: timestamp,
    idempotencyKey: "idem-assessment-1"
  } as const;

  it("keeps client request and persisted assessment result separate", () => {
    expect(assessmentRequestSchema.safeParse(request).success).toBe(true);
    expect(assessmentRequestSchema.safeParse({ ...request, confidence: 1.01 }).success).toBe(false);
    expect(assessmentRecordSchema.safeParse({ ...request, eventId: "event-1", correct: false, evidenceScore: 0, unfamiliarContext: false }).success).toBe(true);
    expect(idempotencyRecordSchema.safeParse({ key: "idem-assessment-1", operation: "assessment_submit", requestHash: "a".repeat(64), actorSubjectId: "subject-evaluator", idempotencyId: "idem-record-1", createdAt: timestamp, expiresAt: laterTimestamp, responseTraceId: "trace-1" }).success).toBe(true);
    expect(idempotencyRecordSchema.safeParse({ key: "idem-assessment-1", operation: "assessment_submit", requestHash: "bad", actorSubjectId: "subject-evaluator", idempotencyId: "idem-record-1", createdAt: timestamp, expiresAt: timestamp, responseTraceId: "trace-1" }).success).toBe(false);
  });

  it("exposes recommendation evidence, route alternatives, scaffold rationale, and audited overrides", () => {
    const recommendation = {
      recommendationId: "recommendation-1",
      profileId: "profile-savita",
      recommendedActivity: "contrastive-payment-direction-simulation",
      recommendedRoute: "deep",
      reason: "The learner answered incorrectly with 90% confidence and failed one transfer scenario.",
      evidenceEventIds: ["event-101", "event-109"],
      expectedPurpose: "Repair the payment-direction misconception before transfer practice.",
      targetConceptIds: ["money_in_vs_money_out"],
      selectedScaffoldLevel: 2,
      alternatives: ["quick", "low_energy"],
      learnerOverrideAllowed: true,
      generatedAt: timestamp
    } as const;
    expect(recommendationSchema.safeParse(recommendation).success).toBe(true);
    expect(recommendationSchema.safeParse({ ...recommendation, alternatives: ["deep"] }).success).toBe(false);
    expect(recommendationSchema.safeParse({ ...recommendation, alternatives: ["quick", "quick"] }).success).toBe(false);
    const scaffold = {
      scaffoldId: "scaffold-1",
      profileId: "profile-savita",
      conceptId: "money_in_vs_money_out",
      recommendedLevel: 2,
      selectedLevel: 2,
      reasonCode: "high_misconception",
      reason: "High-confidence incorrect evidence warrants a contrastive explanation.",
      evidenceEventIds: ["event-101"],
      learnerOverrideAllowed: true,
      generatedAt: timestamp
    } as const;
    expect(scaffoldRecommendationSchema.safeParse(scaffold).success).toBe(true);
    const override = {
      overrideId: "override-1",
      profileId: "profile-savita",
      recommendationId: recommendation.recommendationId,
      target: { target: "scaffold", requestedLevel: 3 },
      reason: "I want to try the decision myself.",
      requestedAt: timestamp,
      idempotencyKey: "idem-override-1"
    } as const;
    expect(learnerOverrideRequestSchema.safeParse(override).success).toBe(true);
    expect(learnerOverrideRecordSchema.safeParse({ ...override, applied: true, verifiedPerformanceImproved: true, evaluatedAt: laterTimestamp }).success).toBe(true);
    expect(learnerOverrideRecordSchema.safeParse({ ...override, applied: true, verifiedPerformanceImproved: true, evaluatedAt: null }).success).toBe(false);
  });
});

describe("lessons, scenario safety, and transfer", () => {
  it("requires the training label and rejects operational unsafe content", () => {
    expect(safeScenarioSchema.safeParse(validScenario).success).toBe(true);
    expect(safeScenarioSchema.safeParse({ ...validScenario, trainingLabel: "LIVE MESSAGE" }).success).toBe(false);
    expect(safeScenarioSchema.safeParse({ ...validScenario, prompt: "Open https://example.com now" }).success).toBe(false);
    expect(safeScenarioSchema.safeParse({ ...validScenario, prompt: "Call +919876543210 immediately" }).success).toBe(false);
    expect(safeScenarioSchema.safeParse({ ...validScenario, prompt: "Share your password: letmein" }).success).toBe(false);
    expect(safeScenarioSchema.safeParse({ ...validScenario, safestChoiceId: "a" }).success).toBe(false);
    expect(safeScenarioSchema.safeParse({ ...validScenario, choices: [{ id: "a", text: "unsafe", classification: "unsafe" }, { id: "a", text: "safe", classification: "safe" }] }).success).toBe(false);
  });

  it("proves live and truthful fallback delivery modes and transfer variation", () => {
    const live = { scenario: validScenario, generationMode: "live_model", modelCallAttempted: true, modelCallSucceeded: true, fallbackReason: null } as const;
    const fallback = { scenario: validScenario, generationMode: "curated_fallback", modelCallAttempted: true, modelCallSucceeded: false, fallbackReason: "timeout" } as const;
    expect(scenarioDeliverySchema.safeParse(live).success).toBe(true);
    expect(scenarioDeliverySchema.safeParse(fallback).success).toBe(true);
    expect(scenarioDeliverySchema.safeParse({ ...fallback, fallbackReason: null }).success).toBe(false);
    expect(scenarioDeliverySchema.safeParse({ ...live, modelCallSucceeded: false }).success).toBe(false);
    const transferScenario = {
      transferId: "scenario-transfer-1",
      sourceScenarioId: validScenario.scenarioId,
      scenario: { ...validScenario, scenarioId: "scenario-job-014", context: "jobs", title: "Job fee decision" },
      sourceConceptIds: ["money_in_vs_money_out"],
      sourceInvariantIds: ["inv-money-direction"],
      unfamiliarContext: true,
      context: "jobs",
      assessmentRubricId: "rubric-money-direction-v1"
    } as const;
    expect(transferScenarioSchema.safeParse(transferScenario).success).toBe(true);
    expect(transferScenarioSchema.safeParse({ ...transferScenario, sourceScenarioId: "scenario-job-014" }).success).toBe(false);
    expect(transferScenarioSchema.safeParse({ ...transferScenario, context: "upi" }).success).toBe(false);
  });
});

describe("teach-back, review, AI evidence, and analytics", () => {
  it("accepts each teach-back input mode and requires evidence-backed output", () => {
    const common = { teachBackId: "teachback-1", profileId: "profile-savita", conceptId: "money_in_vs_money_out", rubricId: "rubric-money-direction-v1", submittedAt: timestamp, idempotencyKey: "idem-teachback-1" };
    expect(teachBackRequestSchema.safeParse({ ...common, input: { mode: "text", text: "A secret code authorizes an outgoing action." } }).success).toBe(true);
    expect(teachBackRequestSchema.safeParse({ ...common, input: { mode: "voice", voiceSessionId: "voice-session-1", voiceConsentVersion: 1 } }).success).toBe(true);
    expect(teachBackRequestSchema.safeParse({ ...common, input: { mode: "diagram", selectedLabels: ["Pause", "Verify"] } }).success).toBe(true);
    expect(teachBackRequestSchema.safeParse({ ...common, input: { mode: "step_by_step", steps: ["Pause", "Use an independent channel"] } }).success).toBe(true);
    const output = {
      teachBackId: "teachback-1",
      profileId: "profile-savita",
      conceptId: "money_in_vs_money_out",
      correctClaims: [{ claim: "A secret code authorizes an action.", invariantId: "inv-money-direction" }],
      partialClaims: [{ claim: "The requester should be checked.", missing: "Use an independent channel." }],
      misconceptions: [{ claim: "A PIN may be required to receive money.", misconceptionId: "pin_needed_to_receive_money", severity: "high" }],
      missingLinks: ["Why independent verification must use a channel not supplied by the requester"],
      targetedQuestion: "Which action proves that you are authorizing money to leave rather than receiving it?",
      rubricVersion: "rubric-money-direction-v1",
      evaluatedAt: laterTimestamp,
      generationMode: "live_model",
      evidenceId: "evidence-teachback-1"
    } as const;
    expect(teachBackOutputSchema.safeParse(output).success).toBe(true);
    expect(teachBackOutputSchema.safeParse({ ...output, correctClaims: [], partialClaims: [], misconceptions: [], missingLinks: [] }).success).toBe(false);
  });

  it("requires historical evidence for future recall estimates and bounds review records", () => {
    const schedule = {
      reviewId: "review-1",
      profileId: "profile-savita",
      conceptId: "money_in_vs_money_out",
      status: "scheduled",
      level: "recall",
      scheduledAt: timestamp,
      nextReviewAt: laterTimestamp,
      intervalDays: 1,
      memoryStabilityDays: 1,
      reason: "Initial review after a high-confidence misconception.",
      sourceEventIds: ["event-101"],
      createdAt: timestamp
    } as const;
    expect(reviewScheduleSchema.safeParse(schedule).success).toBe(true);
    expect(reviewScheduleSchema.safeParse({ ...schedule, nextReviewAt: "2026-08-21T06:30:00Z" }).success).toBe(false);
    const estimate = {
      label: "Estimated recall, not a guarantee",
      profileId: "profile-savita",
      conceptId: "money_in_vs_money_out",
      estimatedRecall: 0.68,
      modelVersion: "forgetting-v1",
      stabilityEstimateDays: 3,
      elapsedDays: 1,
      observationCount: 2,
      expectedReviewSchedule: [laterTimestamp],
      generatedAt: timestamp
    } as const;
    expect(recallEstimateSchema.safeParse(estimate).success).toBe(true);
    expect(recallEstimateSchema.safeParse({ ...estimate, observationCount: 1 }).success).toBe(false);
  });

  it("distinguishes live model evidence, failure evidence, and curated fallback", () => {
    const live = {
      feature: "adaptive_explanation",
      provider: "vertex-ai",
      model: "configured-model",
      requestId: "trace-live-1",
      generatedAt: timestamp,
      latencyMs: 1_830,
      schemaValid: true,
      safetyValid: true,
      generationMode: "live_model",
      modelCallAttempted: true,
      modelCallSucceeded: true,
      sourceConceptIds: ["money_in_vs_money_out"],
      promptTemplateVersion: "explanation-v3"
    } as const;
    const fallback = {
      feature: "adaptive_explanation",
      provider: "vertex-ai",
      model: "configured-model",
      requestId: "trace-fallback-1",
      generatedAt: timestamp,
      latencyMs: 12_000,
      schemaValid: true,
      safetyValid: true,
      generationMode: "curated_fallback",
      modelCallAttempted: true,
      modelCallSucceeded: false,
      failureReason: "timeout",
      fallbackLabel: "Curated fallback used because the live model was unavailable or its output was rejected.",
      sourceConceptIds: ["money_in_vs_money_out"],
      promptTemplateVersion: "explanation-v3"
    } as const;
    expect(liveAiEvidenceSchema.safeParse(live).success).toBe(true);
    expect(fallbackAiEvidenceSchema.safeParse(fallback).success).toBe(true);
    expect(fallbackAiEvidenceSchema.safeParse({ ...fallback, fallbackLabel: "Live model output" }).success).toBe(false);
    expect(fallbackContentSchema.safeParse({ generationMode: "curated_fallback", modelCallAttempted: true, modelCallSucceeded: false, fallbackReason: "schema_invalid", label: "Curated fallback used because the live model was unavailable or its output was rejected.", contentId: "curated-lesson-1", sourceConceptIds: ["money_in_vs_money_out"], validatedAt: timestamp }).success).toBe(true);
  });

  it("rejects decorative analytics and accepts persisted event-derived metrics", () => {
    const valid = { metricId: "metric-1", name: "transfer_success", profileId: "profile-savita", value: 0.5, sampleSize: 2, derivedFromEventNames: ["transfer_succeeded", "transfer_failed"], lastUpdatedAt: timestamp, emptyState: false, seeded: false } as const;
    expect(analyticsMetricSchema.safeParse(valid).success).toBe(true);
    expect(analyticsMetricSchema.safeParse({ ...valid, value: 1.2 }).success).toBe(false);
    expect(analyticsMetricSchema.safeParse({ ...valid, profileId: undefined, householdId: undefined }).success).toBe(false);
    expect(analyticsMetricSchema.safeParse({ ...valid, sampleSize: 0, emptyState: false }).success).toBe(false);
    expect(analyticsMetricSchema.safeParse({ ...valid, value: 0.1, emptyState: true }).success).toBe(false);
    expect(analyticsMetricSchema.safeParse({ ...valid, sampleSize: 0, value: 0, emptyState: true }).success).toBe(true);
  });

  it("requires deterministic state-transition evidence", () => {
    const transition = {
      transitionId: "transition-1",
      profileId: "profile-savita",
      conceptId: "money_in_vs_money_out",
      stateBefore: { status: "assessed", mastery: 0.32, misconceptionSeverity: 0.88 },
      stateAfter: { status: "assessed", mastery: 0.48, misconceptionSeverity: 0.67 },
      formulaVersion: "evidence-v1",
      inputEventIds: ["event-118", "event-119"],
      reason: "Correct transfer answer with no hints after misconception correction",
      transitionedAt: laterTimestamp
    } as const;
    expect(stateTransitionEvidenceSchema.safeParse(transition).success).toBe(true);
    expect(stateTransitionEvidenceSchema.safeParse({ ...transition, stateBefore: {} }).success).toBe(false);
  });
});

describe("analytics event discriminated union", () => {
  const payloads: Record<string, Record<string, unknown>> = {
    account_created: { authProvider: "seeded_evaluator" },
    household_created: { householdName: "Bharat Digital Family" },
    profile_created: { ageBand: "56_plus" },
    profile_selected: { selectionReason: "switch" },
    constitution_updated: { constitutionVersion: 1 },
    diagnostic_started: { diagnosticId: "diagnostic-1" },
    diagnostic_answered: { assessmentId: "assessment-1", selectedChoiceId: "a" },
    diagnostic_completed: { diagnosticId: "diagnostic-1", score: 0.2 },
    activity_recommended: { recommendationId: "recommendation-1", route: "deep", scaffoldLevel: 2 },
    route_overridden: { overrideId: "override-1", route: "quick" },
    scaffold_changed: { overrideId: "override-1", scaffoldLevel: 3 },
    lesson_started: { lessonId: "lesson-1" },
    hint_requested: { hintNumber: 1 },
    scenario_answered: { scenarioId: "scenario-payment-001", choiceId: "a" },
    confidence_submitted: { assessmentId: "assessment-1" },
    teachback_submitted: { teachBackId: "teachback-1" },
    teachback_evaluated: { teachBackId: "teachback-1", misconceptionCount: 1 },
    transfer_attempted: { transferId: "scenario-transfer-1" },
    transfer_succeeded: { transferId: "scenario-transfer-1" },
    transfer_failed: { transferId: "scenario-transfer-1" },
    concept_state_updated: { transitionId: "transition-1", formulaVersion: "evidence-v1" },
    misconception_created: { misconceptionId: "pin_needed_to_receive_money", severity: 0.88 },
    misconception_updated: { misconceptionId: "pin_needed_to_receive_money", severity: 0.67 },
    review_scheduled: { reviewId: "review-1", nextReviewAt: laterTimestamp },
    review_completed: { reviewId: "review-1", success: true },
    model_call_started: { feature: "adaptive_explanation", provider: "vertex-ai", model: "configured-model", requestId: "trace-1" },
    model_call_completed: { feature: "adaptive_explanation", provider: "vertex-ai", model: "configured-model", requestId: "trace-1", generationMode: "live_model" },
    model_output_rejected: { feature: "adaptive_explanation", reason: "schema_invalid" },
    fallback_used: { feature: "adaptive_explanation", reason: "timeout" },
    profile_exported: { exportId: "export-1" },
    profile_deleted: { deletionId: "deletion-1" }
  };

  it("accepts every required event discriminant and rejects unknown names/fields", () => {
    const names = Object.keys(payloads);
    expect(names).toHaveLength(31);
    for (const [eventName, payload] of Object.entries(payloads)) {
      const event = { ...eventBase, eventName, payload };
      expect(analyticsEventNameSchema.safeParse(eventName).success).toBe(true);
      expect(eventSchema.safeParse(event).success, eventName).toBe(true);
    }
    expect(eventSchema.safeParse({ ...eventBase, eventName: "scenario_answered" }).success).toBe(true);
    expect(eventSchema.safeParse({ ...eventBase, eventName: "unknown", payload: {} }).success).toBe(false);
    expect(eventSchema.safeParse({ ...eventBase, eventName: "account_created", payload: { authProvider: "google", extra: true } }).success).toBe(false);
  });

  it("supports a typed event value without allowing arbitrary metadata", () => {
    const event: AnalyticsEvent = { ...eventBase, eventName: "scenario_answered", payload: { scenarioId: "scenario-payment-001", choiceId: "a" } };
    expect(accountCreatedEventSchema.safeParse({ ...eventBase, eventName: "account_created", payload: { authProvider: "google" } }).success).toBe(true);
    expect(activityRecommendedEventSchema.safeParse({ ...eventBase, eventName: "activity_recommended", payload: { recommendationId: "r", route: "deep", scaffoldLevel: 2 } }).success).toBe(true);
    expect(analyticsEventSchema.parse(event).eventName).toBe("scenario_answered");
  });
});
