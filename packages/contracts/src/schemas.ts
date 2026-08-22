import { z, type ZodError, type ZodType } from "zod";

/* -------------------------------------------------------------------------- */
/* Shared primitives and safe parsing                                         */
/* -------------------------------------------------------------------------- */

export const opaqueIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, "must be an opaque identifier");

export const eventIdSchema = opaqueIdSchema;
export const profileIdSchema = opaqueIdSchema;
export const householdIdSchema = opaqueIdSchema;
export const conceptIdSchema = opaqueIdSchema;
export const invariantIdSchema = opaqueIdSchema;
export const rubricIdSchema = opaqueIdSchema;
export const activityIdSchema = opaqueIdSchema;
export const sessionIdSchema = opaqueIdSchema;
export const traceIdSchema = opaqueIdSchema;

export const versionSchema = z.number().int().min(1).max(10_000);
export const schemaVersionSchema = z
  .string()
  .trim()
  .regex(/^\d+\.\d+$/, "must be a semantic contract version");
export const isoTimestampSchema = z.string().datetime({ offset: true });
export const scoreSchema = z.number().finite().min(0).max(1);
export const probabilitySchema = scoreSchema;
export const nonNegativeFiniteSchema = z.number().finite().min(0);
export const boundedResponseTimeSchema = z.number().int().min(0).max(120_000);
export const boundedTextSchema = z.string().trim().min(1).max(2_000);
export const shortTextSchema = z.string().trim().min(1).max(240);
export const mediumTextSchema = z.string().trim().min(1).max(1_000);
export const urlSchema = z.string().url().max(2_048);
export const emptyMetadataSchema = z.object({}).strict();

export const supportedLanguageSchema = z.enum(["hi", "en", "hinglish", "hi_en"]);
export type SupportedLanguage = z.infer<typeof supportedLanguageSchema>;

export const ageBandSchema = z.enum([
  "under_13",
  "13_17",
  "18_24",
  "25_34",
  "35_55",
  "56_plus",
  "unspecified"
]);

export const contextSchema = z.enum([
  "pension",
  "messaging",
  "upi",
  "internship",
  "gaming",
  "online_shopping",
  "jobs",
  "small_business",
  "qr_payments",
  "customer_support",
  "qr",
  "collect_request",
  "support_call",
  "transaction",
  "shopping",
  "public_services",
  "digital_identity",
  "household"
]);

export const modalitySchema = z.enum([
  "diagnostic",
  "lesson",
  "simulation",
  "transfer",
  "teach_back",
  "retrieval",
  "explanation"
]);

export const parseContract = <T>(schema: ZodType<T>, value: unknown): T => {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  throw new ContractValidationError(parsed.error);
};

export type SafeParseContractResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ZodError };

export const safeParseContract = <T>(
  schema: ZodType<T>,
  value: unknown
): SafeParseContractResult<T> => schema.safeParse(value);

export class ContractValidationError extends Error {
  public readonly issues: z.ZodIssue[];

  public constructor(error: ZodError) {
    super("Contract validation failed");
    this.name = "ContractValidationError";
    this.issues = error.issues;
  }
}

/* -------------------------------------------------------------------------- */
/* Authorization, API errors, and public runtime configuration                */
/* -------------------------------------------------------------------------- */

export const authorizationRoleSchema = z.enum([
  "household_owner",
  "household_member",
  "learner",
  "evaluator"
]);

export const authorizationSubjectSchema = z
  .object({
    subjectId: opaqueIdSchema,
    tenantId: householdIdSchema,
    roles: z.array(authorizationRoleSchema).min(1).max(4),
    profileIds: z.array(profileIdSchema).max(50),
    authenticatedAt: isoTimestampSchema
  })
  .strict()
  .superRefine((subject, context) => {
    if (new Set(subject.roles).size !== subject.roles.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["roles"], message: "roles must be unique" });
    }
    if (new Set(subject.profileIds).size !== subject.profileIds.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["profileIds"], message: "profile IDs must be unique" });
    }
  });

export const authorizationScopeSchema = z.object({
  tenantId: householdIdSchema,
  profileId: profileIdSchema.optional(),
  resource: z.enum(["household", "profile", "learning_state", "event", "export"]),
  action: z.enum(["read", "create", "update", "delete", "export"])
}).strict();

export const authorizationDecisionSchema = z.object({
  allowed: z.boolean(),
  subjectId: opaqueIdSchema,
  scope: authorizationScopeSchema,
  reasonCode: z.enum(["owner", "member", "learner", "evaluator", "missing_membership", "profile_not_owned", "role_denied"]),
  traceId: traceIdSchema,
  evaluatedAt: isoTimestampSchema
}).strict();

export const apiErrorCodeSchema = z.enum([
  "unauthorized",
  "forbidden",
  "not_found",
  "validation_failed",
  "conflict",
  "idempotency_conflict",
  "rate_limited",
  "provider_timeout",
  "provider_refusal",
  "provider_error",
  "invalid_model_output",
  "safety_rejected",
  "internal_error"
]);

export const apiFieldErrorSchema = z.object({
  path: z.array(z.union([z.string().min(1).max(100), z.number().int().min(0)])).max(20),
  message: shortTextSchema,
  code: z.enum(["required", "invalid_type", "invalid_value", "unrecognized_key", "too_small", "too_big", "custom"])
}).strict();

export const apiErrorDetailsSchema = z.object({
  fields: z.array(apiFieldErrorSchema).max(50).optional(),
  retryable: z.boolean().optional()
}).strict();

export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  message: shortTextSchema,
  traceId: traceIdSchema,
  details: apiErrorDetailsSchema.optional()
}).strict();

export const apiErrorEnvelopeSchema = z.object({
  error: apiErrorSchema,
  status: z.number().int().min(400).max(599)
}).strict();

export const providerSchema = z.enum(["vertex-ai"]);
export const publicRuntimeConfigSchema = z.object({
  environment: z.enum(["development", "staging", "production"]),
  appVersion: shortTextSchema,
  apiBaseUrl: urlSchema,
  supportedLanguages: z.array(supportedLanguageSchema).min(1).max(4),
  model: z.object({
    provider: providerSchema,
    modelId: shortTextSchema,
    location: shortTextSchema,
    maxOutputTokens: z.number().int().min(1).max(32_000),
    timeoutMs: z.number().int().min(1_000).max(12_000)
  }).strict(),
  featureFlags: z.object({
    adaptiveExplanation: z.boolean(),
    teachBackAnalysis: z.boolean(),
    simulator: z.boolean(),
    evaluatorControls: z.boolean()
  }).strict(),
  traceSamplingRate: scoreSchema
}).strict().superRefine((config, context) => {
  const languages = new Set(config.supportedLanguages);
  if (languages.size !== config.supportedLanguages.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["supportedLanguages"], message: "languages must be unique" });
  }
});
export const publicConfigSchema = publicRuntimeConfigSchema;
export const publicRuntimeSchema = publicRuntimeConfigSchema;

/* -------------------------------------------------------------------------- */
/* Households, profiles, constitution, consent, and signal controls           */
/* -------------------------------------------------------------------------- */

export const householdStatusSchema = z.enum(["active", "deleted"]);
export const householdCreateRequestSchema = z.object({
  displayName: shortTextSchema
}).strict();
export const householdRecordSchema = z.object({
  householdId: householdIdSchema,
  displayName: shortTextSchema,
  ownerSubjectId: opaqueIdSchema,
  status: householdStatusSchema,
  profileIds: z.array(profileIdSchema).max(50),
  seededLabel: z.enum(["Evaluator test account", "Seeded starting state"]).optional(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema
}).strict().superRefine((household, context) => {
  if (new Set(household.profileIds).size !== household.profileIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["profileIds"], message: "profile IDs must be unique" });
  }
  if (household.updatedAt < household.createdAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["updatedAt"], message: "updatedAt cannot precede createdAt" });
  }
});
export const householdSchema = householdRecordSchema;

export const profileStatusSchema = z.enum(["active", "deleted"]);
export const interfaceModeSchema = z.enum(["standard", "voice_first", "fast_interactive", "transaction_focused"]);
export const profileCreateRequestSchema = z.object({
  displayName: shortTextSchema,
  ageBand: ageBandSchema,
  interfaceMode: interfaceModeSchema,
  preferredLanguage: supportedLanguageSchema
}).strict();
export const profilePatchRequestSchema = z.object({
  displayName: shortTextSchema.optional(),
  interfaceMode: interfaceModeSchema.optional(),
  preferredLanguage: supportedLanguageSchema.optional()
}).strict().refine((profile) => Object.keys(profile).length > 0, "at least one profile field is required");
export const profileRecordSchema = z.object({
  profileId: profileIdSchema,
  householdId: householdIdSchema,
  displayName: shortTextSchema,
  ageBand: ageBandSchema,
  interfaceMode: interfaceModeSchema,
  preferredLanguage: supportedLanguageSchema,
  status: profileStatusSchema,
  constitutionVersion: versionSchema,
  seededLabel: z.enum(["Evaluator test account", "Seeded starting state"]).optional(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema
}).strict().superRefine((profile, context) => {
  if (profile.updatedAt < profile.createdAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["updatedAt"], message: "updatedAt cannot precede createdAt" });
  }
});
export const profileSchema = profileRecordSchema;

export const readingComplexitySchema = z.enum(["simple", "standard", "advanced"]);
export const explanationDepthSchema = z.enum(["brief", "conceptual", "deep"]);
export const challengePreferenceSchema = z.enum(["gentle", "moderate", "high"]);
export const textSizeSchema = z.enum(["small", "medium", "large", "extra_large"]);

export const accessibilitySettingsSchema = z.object({
  keyboardOnly: z.boolean(),
  reducedMotion: z.boolean(),
  captions: z.boolean(),
  textSize: textSizeSchema,
  highContrast: z.boolean(),
  screenReaderOptimized: z.boolean()
}).strict();

export const personalizationSignalsSchema = z.object({
  correctness: z.boolean(),
  confidence: z.boolean(),
  responseTime: z.boolean(),
  hintUse: z.boolean(),
  teachBack: z.boolean(),
  transfer: z.boolean()
}).strict();
export const personalizationSignalSchema = z.enum([
  "correctness",
  "confidence",
  "responseTime",
  "hintUse",
  "teachBack",
  "transfer"
]);
export const personalizationSignalControlSchema = z.object({
  signal: personalizationSignalSchema,
  enabled: z.boolean(),
  changedAt: isoTimestampSchema
}).strict();

const constitutionFields = {
  goal: mediumTextSchema,
  deadline: isoTimestampSchema.nullable(),
  sessionMinutes: z.number().int().min(3).max(15),
  interfaceMode: interfaceModeSchema.optional(),
  preferredLanguages: z.array(supportedLanguageSchema).min(1).max(4),
  readingComplexity: readingComplexitySchema,
  explanationDepth: explanationDepthSchema,
  challengePreference: challengePreferenceSchema,
  relevantContexts: z.array(contextSchema).min(1).max(12),
  allowVoiceProcessing: z.boolean(),
  allowCrossSessionPersonalization: z.boolean(),
  allowReminderNotifications: z.boolean(),
  personalizationSignals: personalizationSignalsSchema,
  accessibility: accessibilitySettingsSchema
};

const learningConstitutionBaseSchema = z.object(constitutionFields).strict();

const validateConstitution = (constitution: z.infer<typeof learningConstitutionBaseSchema>, context: z.RefinementCtx): void => {
  if (new Set(constitution.preferredLanguages).size !== constitution.preferredLanguages.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["preferredLanguages"], message: "languages must be unique" });
  }
  if (new Set(constitution.relevantContexts).size !== constitution.relevantContexts.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["relevantContexts"], message: "contexts must be unique" });
  }
  if (!constitution.allowCrossSessionPersonalization && Object.values(constitution.personalizationSignals).some(Boolean)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["personalizationSignals"], message: "signals require cross-session consent" });
  }
  if (!constitution.allowVoiceProcessing && constitution.interfaceMode === "voice_first") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["allowVoiceProcessing"], message: "voice-first mode requires voice consent" });
  }
};

export const learningConstitutionSchema = learningConstitutionBaseSchema.superRefine(validateConstitution);

// The constitution is learner-owned. `interfaceMode` is intentionally part of
// the persisted constitution as well as the profile so changing the policy can
// be audited without treating a profile label as a learning signal.
export const constitutionRecordSchema = learningConstitutionBaseSchema.extend({
  constitutionId: opaqueIdSchema,
  profileId: profileIdSchema,
  version: versionSchema,
  updatedAt: isoTimestampSchema
}).strict().superRefine(validateConstitution);
export const constitutionUpdateRequestSchema = learningConstitutionSchema;

export const consentRecordSchema = z.object({
  consentId: opaqueIdSchema,
  profileId: profileIdSchema,
  version: versionSchema,
  voiceProcessing: z.boolean(),
  crossSessionPersonalization: z.boolean(),
  reminderNotifications: z.boolean(),
  capturedAt: isoTimestampSchema,
  withdrawnAt: isoTimestampSchema.nullable()
}).strict().superRefine((consent, context) => {
  if (consent.withdrawnAt !== null && consent.withdrawnAt < consent.capturedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["withdrawnAt"], message: "withdrawal cannot precede capture" });
  }
});
export const consentUpdateRequestSchema = z.object({
  voiceProcessing: z.boolean(),
  crossSessionPersonalization: z.boolean(),
  reminderNotifications: z.boolean()
}).strict();

/* -------------------------------------------------------------------------- */
/* Curriculum concepts, invariants, rubrics, and graph                        */
/* -------------------------------------------------------------------------- */

export const safetyClassificationSchema = z.enum(["preventive_education"]);
export const graphEdgeTypeSchema = z.enum([
  "prerequisite_of",
  "related_to",
  "contrasts_with",
  "transfers_to",
  "misconception_of",
  "remediated_by",
  "assessed_by"
]);

export const invariantRecordSchema = z.object({
  invariantId: invariantIdSchema,
  conceptId: conceptIdSchema,
  statement: mediumTextSchema,
  safetyCritical: z.boolean()
}).strict();
export const invariantSchema = invariantRecordSchema;

export const rubricCriterionSchema = z.object({
  criterionId: opaqueIdSchema,
  label: shortTextSchema,
  requiredInvariantIds: z.array(invariantIdSchema).min(1).max(20),
  weight: scoreSchema
}).strict().superRefine((criterion, context) => {
  if (new Set(criterion.requiredInvariantIds).size !== criterion.requiredInvariantIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["requiredInvariantIds"], message: "invariant IDs must be unique" });
  }
});

export const rubricSchema = z.object({
  rubricId: rubricIdSchema,
  version: versionSchema,
  conceptId: conceptIdSchema,
  criteria: z.array(rubricCriterionSchema).min(1).max(20),
  passingScore: scoreSchema
}).strict().superRefine((rubric, context) => {
  if (new Set(rubric.criteria.map((criterion) => criterion.criterionId)).size !== rubric.criteria.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["criteria"], message: "criterion IDs must be unique" });
  }
  const totalWeight = rubric.criteria.reduce((total, criterion) => total + criterion.weight, 0);
  if (totalWeight <= 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["criteria"], message: "criteria must have positive weight" });
  }
});

export const conceptSchema = z.object({
  conceptId: conceptIdSchema,
  name: shortTextSchema,
  learningObjective: mediumTextSchema,
  invariants: z.array(mediumTextSchema).min(1).max(20),
  invariantIds: z.array(invariantIdSchema).max(20).optional(),
  prerequisites: z.array(conceptIdSchema).max(20),
  misconceptionIds: z.array(opaqueIdSchema).max(20),
  contexts: z.array(contextSchema).min(1).max(12),
  riskWeight: scoreSchema,
  reviewImportance: scoreSchema,
  rubricId: rubricIdSchema,
  safetyClassification: safetyClassificationSchema
}).strict().superRefine((concept, context) => {
  if (new Set(concept.prerequisites).size !== concept.prerequisites.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["prerequisites"], message: "prerequisites must be unique" });
  }
  if (new Set(concept.contexts).size !== concept.contexts.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["contexts"], message: "contexts must be unique" });
  }
  if (concept.invariantIds !== undefined && new Set(concept.invariantIds).size !== concept.invariantIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["invariantIds"], message: "invariant IDs must be unique" });
  }
});

export const graphEdgeSchema = z.object({
  edgeId: opaqueIdSchema,
  sourceConceptId: conceptIdSchema,
  targetConceptId: conceptIdSchema,
  edgeType: graphEdgeTypeSchema,
  rationale: shortTextSchema.optional(),
  invariantId: invariantIdSchema.optional()
}).strict().superRefine((edge, context) => {
  if (edge.sourceConceptId === edge.targetConceptId && edge.edgeType === "prerequisite_of") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["targetConceptId"], message: "a concept cannot prerequisite itself" });
  }
  if (edge.edgeType === "assessed_by" && edge.invariantId === undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["invariantId"], message: "assessment edges require an invariant" });
  }
});

export const conceptGraphSchema = z.object({
  graphId: opaqueIdSchema,
  version: versionSchema,
  concepts: z.array(conceptSchema).min(1).max(500),
  invariants: z.array(invariantRecordSchema).min(1).max(2_000),
  rubrics: z.array(rubricSchema).min(1).max(500),
  edges: z.array(graphEdgeSchema).max(5_000)
}).strict().superRefine((graph, context) => {
  if (new Set(graph.concepts.map((concept) => concept.conceptId)).size !== graph.concepts.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["concepts"], message: "concept IDs must be unique" });
  }
  if (new Set(graph.invariants.map((invariant) => invariant.invariantId)).size !== graph.invariants.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["invariants"], message: "invariant IDs must be unique" });
  }
});

/* -------------------------------------------------------------------------- */
/* Living Knowledge Twin and misconception records                            */
/* -------------------------------------------------------------------------- */

export const stateLabelSchema = z.enum(["Unknown", "Developing", "Fragile", "Functional", "Strong"]);
export const scaffoldLevelSchema = z.number().int().min(1).max(5);
export const evidenceEventIdsSchema = z.array(eventIdSchema).max(50);

const stateIdentityFields = {
  profileId: profileIdSchema,
  conceptId: conceptIdSchema,
  evidenceEventIds: evidenceEventIdsSchema
};

const unassessedStateSchema = z.object({
  ...stateIdentityFields,
  status: z.literal("unassessed"),
  mastery: z.null(),
  uncertainty: z.null(),
  attempts: z.literal(0),
  correctAttempts: z.literal(0),
  averageConfidence: z.null(),
  averageResponseTimeMs: z.null(),
  hintsUsed: z.literal(0),
  currentScaffoldLevel: scaffoldLevelSchema,
  transferSuccesses: z.literal(0),
  transferFailures: z.literal(0),
  misconceptionSeverity: z.null(),
  memoryStabilityDays: z.null(),
  lastPractisedAt: z.null(),
  nextReviewAt: z.null(),
  stateLabel: z.literal("Unknown")
}).strict();

const assessedStateSchema = z.object({
  ...stateIdentityFields,
  status: z.literal("assessed"),
  mastery: scoreSchema,
  uncertainty: scoreSchema,
  attempts: z.number().int().min(1),
  correctAttempts: z.number().int().min(0),
  averageConfidence: scoreSchema,
  averageResponseTimeMs: boundedResponseTimeSchema,
  hintsUsed: z.number().int().min(0),
  currentScaffoldLevel: scaffoldLevelSchema,
  transferSuccesses: z.number().int().min(0),
  transferFailures: z.number().int().min(0),
  misconceptionSeverity: scoreSchema,
  memoryStabilityDays: z.number().finite().min(1).max(60),
  lastPractisedAt: isoTimestampSchema,
  nextReviewAt: isoTimestampSchema.nullable(),
  stateLabel: stateLabelSchema
}).strict();

export const learnerStateSchema = z.discriminatedUnion("status", [unassessedStateSchema, assessedStateSchema]).superRefine((state, context) => {
  if (state.correctAttempts > state.attempts) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["correctAttempts"], message: "correct attempts cannot exceed attempts" });
  }
  if (state.status === "assessed" && state.transferSuccesses + state.transferFailures > state.attempts) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["transferSuccesses"], message: "transfer observations cannot exceed attempts" });
  }
});
export const learnerConceptStateSchema = learnerStateSchema;
export const learnerStateRecordSchema = learnerStateSchema;

export const misconceptionSeverityBandSchema = z.enum(["low", "medium", "high"]);
export const misconceptionStatusSchema = z.enum(["active", "resolved", "dismissed"]);
export const misconceptionSchema = z.object({
  misconceptionRecordId: opaqueIdSchema,
  misconceptionId: opaqueIdSchema,
  profileId: profileIdSchema,
  conceptId: conceptIdSchema,
  status: misconceptionStatusSchema,
  severity: scoreSchema,
  severityBand: misconceptionSeverityBandSchema,
  confidence: scoreSchema,
  recurrenceCount: z.number().int().min(1),
  recurrenceNormalized: scoreSchema,
  conceptRisk: scoreSchema,
  firstDetectedAt: isoTimestampSchema,
  lastDetectedAt: isoTimestampSchema,
  evidenceEventIds: evidenceEventIdsSchema,
  correctionInvariantId: invariantIdSchema.optional()
}).strict().superRefine((misconception, context) => {
  if (misconception.lastDetectedAt < misconception.firstDetectedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["lastDetectedAt"], message: "last detection cannot precede first detection" });
  }
  const expectedBand = misconception.severity < 0.4 ? "low" : misconception.severity < 0.7 ? "medium" : "high";
  if (misconception.severityBand !== expectedBand) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["severityBand"], message: "severity band does not match severity" });
  }
});
export const misconceptionRecordSchema = misconceptionSchema;

/* -------------------------------------------------------------------------- */
/* Assessment observations and idempotent operations                          */
/* -------------------------------------------------------------------------- */

export const assessmentTypeSchema = z.enum(["diagnostic", "recall", "application", "transfer"]);
export const answerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), choiceId: opaqueIdSchema }).strict(),
  z.object({ kind: z.literal("text"), text: boundedTextSchema }).strict(),
  z.object({ kind: z.literal("steps"), steps: z.array(boundedTextSchema).min(1).max(20) }).strict()
]);

export const assessmentRequestSchema = z.object({
  assessmentId: opaqueIdSchema,
  profileId: profileIdSchema,
  conceptId: conceptIdSchema,
  activityId: activityIdSchema,
  assessmentType: assessmentTypeSchema,
  answer: answerSchema,
  confidence: scoreSchema,
  responseTimeMs: boundedResponseTimeSchema,
  hintsUsed: z.number().int().min(0).max(20),
  context: contextSchema,
  submittedAt: isoTimestampSchema,
  idempotencyKey: opaqueIdSchema
}).strict();

export const assessmentRecordSchema = assessmentRequestSchema.extend({
  eventId: eventIdSchema,
  correct: z.boolean(),
  evidenceScore: scoreSchema,
  unfamiliarContext: z.boolean()
}).strict();
export const assessmentSchema = assessmentRecordSchema;
export const assessmentObservationSchema = assessmentRecordSchema;

export const idempotencyRequestSchema = z.object({
  key: opaqueIdSchema,
  operation: z.enum(["assessment_submit", "teachback_submit", "route_override", "constitution_update", "profile_delete"]),
  requestHash: z.string().trim().regex(/^[a-f0-9]{64}$/),
  actorSubjectId: opaqueIdSchema
}).strict();
export const idempotencyRecordSchema = idempotencyRequestSchema.extend({
  idempotencyId: opaqueIdSchema,
  createdAt: isoTimestampSchema,
  expiresAt: isoTimestampSchema,
  responseTraceId: traceIdSchema
}).strict().superRefine((record, context) => {
  if (record.expiresAt <= record.createdAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["expiresAt"], message: "expiry must be after creation" });
  }
});
export const idempotencySchema = idempotencyRecordSchema;

/* -------------------------------------------------------------------------- */
/* Route engine, recommendations, scaffold dial, and learner overrides         */
/* -------------------------------------------------------------------------- */

export const routeKindSchema = z.enum(["quick", "deep", "low_energy"]);
export const routeActivityTypeSchema = z.enum(["retrieval", "explanation", "simulation", "transfer", "teach_back"]);
export const routeAlternativeSchema = z.enum(["quick_retrieval", "deep_explanation", "low_energy_example"]);
const routeAlternativeOrKindSchema = z.union([routeKindSchema, routeAlternativeSchema]);
export const routeSchema = z.object({
  routeId: opaqueIdSchema,
  kind: routeKindSchema,
  title: shortTextSchema,
  description: mediumTextSchema,
  expectedPurpose: mediumTextSchema,
  activityType: routeActivityTypeSchema,
  estimatedMinutes: z.number().int().min(1).max(15),
  conceptIds: z.array(conceptIdSchema).min(1).max(10),
  scaffoldLevel: scaffoldLevelSchema,
  learnerOverrideAllowed: z.literal(true)
}).strict();

export const recommendationSchema = z.object({
  recommendationId: opaqueIdSchema,
  profileId: profileIdSchema,
  recommendedActivity: activityIdSchema,
  recommendedRoute: routeKindSchema,
  reason: mediumTextSchema,
  evidenceEventIds: evidenceEventIdsSchema,
  expectedPurpose: mediumTextSchema,
  targetConceptIds: z.array(conceptIdSchema).min(1).max(10),
  selectedScaffoldLevel: scaffoldLevelSchema,
  alternatives: z.array(routeAlternativeOrKindSchema).min(1).max(3),
  learnerOverrideAllowed: z.literal(true),
  generatedAt: isoTimestampSchema
}).strict().superRefine((recommendation, context) => {
  if (recommendation.alternatives.includes(recommendation.recommendedRoute)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["alternatives"], message: "alternatives cannot include the recommended route" });
  }
  if (new Set(recommendation.alternatives).size !== recommendation.alternatives.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["alternatives"], message: "alternatives must be unique" });
  }
});
export const routeRecommendationSchema = recommendationSchema;

export const scaffoldReasonSchema = z.enum([
  "unassessed",
  "low_mastery",
  "high_misconception",
  "correct_low_confidence",
  "repeated_hint_dependence",
  "fast_correct_transfer",
  "deterministic_default",
  "learner_override"
]);
export const scaffoldRecommendationSchema = z.object({
  scaffoldId: opaqueIdSchema,
  profileId: profileIdSchema,
  conceptId: conceptIdSchema,
  recommendedLevel: scaffoldLevelSchema,
  selectedLevel: scaffoldLevelSchema,
  reasonCode: scaffoldReasonSchema,
  reason: mediumTextSchema,
  evidenceEventIds: evidenceEventIdsSchema,
  learnerOverrideAllowed: z.literal(true),
  generatedAt: isoTimestampSchema
}).strict();
export const scaffoldDialSchema = scaffoldRecommendationSchema;

export const overrideTargetSchema = z.discriminatedUnion("target", [
  z.object({ target: z.literal("route"), requestedRoute: routeKindSchema }).strict(),
  z.object({ target: z.literal("scaffold"), requestedLevel: scaffoldLevelSchema }).strict()
]);
export const learnerOverrideRequestSchema = z.object({
  overrideId: opaqueIdSchema,
  profileId: profileIdSchema,
  recommendationId: opaqueIdSchema,
  target: overrideTargetSchema,
  reason: shortTextSchema.optional(),
  requestedAt: isoTimestampSchema,
  idempotencyKey: opaqueIdSchema
}).strict();
export const learnerOverrideRecordSchema = learnerOverrideRequestSchema.extend({
  applied: z.boolean(),
  verifiedPerformanceImproved: z.boolean().nullable(),
  evaluatedAt: isoTimestampSchema.nullable()
}).strict().superRefine((override, context) => {
  if (override.evaluatedAt === null && override.verifiedPerformanceImproved !== null) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["evaluatedAt"], message: "an outcome requires an evaluation timestamp" });
  }
});
export const learnerOverrideSchema = learnerOverrideRecordSchema;
export const routeOverrideRequestSchema = learnerOverrideRequestSchema;
export const routeOverrideSchema = learnerOverrideRecordSchema;

/* -------------------------------------------------------------------------- */
/* Lessons, safe training scenarios, and transfer                             */
/* -------------------------------------------------------------------------- */

export const contentGenerationModeSchema = z.enum(["curated", "live_model", "curated_fallback"]);
export const lessonSchema = z.object({
  lessonId: activityIdSchema,
  profileId: profileIdSchema,
  conceptIds: z.array(conceptIdSchema).min(1).max(10),
  language: supportedLanguageSchema,
  route: routeKindSchema,
  scaffoldLevel: scaffoldLevelSchema,
  title: shortTextSchema,
  objective: mediumTextSchema,
  explanation: mediumTextSchema,
  workedExample: mediumTextSchema.optional(),
  sourceInvariantIds: z.array(invariantIdSchema).min(1).max(20),
  sourceRubricId: rubricIdSchema,
  generationMode: contentGenerationModeSchema,
  createdAt: isoTimestampSchema
}).strict();

export const scenarioChoiceSchema = z.object({
  id: opaqueIdSchema,
  text: shortTextSchema,
  classification: z.enum(["safe", "unsafe"])
}).strict();

export const scenarioConstraintsSchema = z.object({
  activeLinks: z.literal(false),
  realOrganizations: z.literal(false),
  realPhoneNumbers: z.literal(false),
  realCredentials: z.literal(false),
  operationalFraudInstructions: z.literal(false)
}).strict();

const scenarioTextHasUnsafeContent = (value: string): boolean => {
  const activeLink = /(?:https?:\/\/|www\.)/i.test(value);
  const phoneNumber = /(?:\+91[\s-]?)?[6-9]\d{9}\b/.test(value);
  const credential = /\b(?:password|passcode|otp|pin|cvv|card\s*(?:number|no\.?)?)\s*[:=]\s*\S+/i.test(value);
  const secretRequest = /\b(?:share|provide|send|enter|tell|disclose|reveal)\b.{0,40}\b(?:password|passcode|otp|pin|secret|cvv)\b/i.test(value);
  return activeLink || phoneNumber || credential || secretRequest;
};

export const scenarioSchema = z.object({
  scenarioId: activityIdSchema,
  trainingLabel: z.literal("TRAINING SIMULATION"),
  title: shortTextSchema,
  conceptIds: z.array(conceptIdSchema).min(1).max(10),
  invariantIds: z.array(invariantIdSchema).min(1).max(20).optional(),
  context: contextSchema,
  channel: z.enum(["fictional_chat", "fictional_call", "fictional_app", "fictional_message", "fictional_counter"]),
  manipulationPatterns: z.array(z.enum(["urgency", "fear", "authority", "reward", "secrecy", "appearance"])).min(1).max(6),
  unsafeRequestCategory: z.enum(["authorize_outgoing_action", "share_secret", "install_unknown_app", "bypass_verification", "pay_job_fee", "trust_unverified_claim"]),
  prompt: mediumTextSchema,
  choices: z.array(scenarioChoiceSchema).min(2).max(6),
  safestChoiceId: opaqueIdSchema,
  feedbackRubricId: rubricIdSchema,
  transferScenarioIds: z.array(activityIdSchema).max(10),
  constraints: scenarioConstraintsSchema
}).strict().superRefine((scenario, context) => {
  const choiceIds = scenario.choices.map((choice) => choice.id);
  if (new Set(choiceIds).size !== choiceIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["choices"], message: "choice IDs must be unique" });
  }
  if (!choiceIds.includes(scenario.safestChoiceId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["safestChoiceId"], message: "safest choice must exist" });
  } else {
    const safestChoice = scenario.choices.find((choice) => choice.id === scenario.safestChoiceId);
    if (safestChoice?.classification !== "safe") {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["safestChoiceId"], message: "safest choice must be classified safe" });
    }
  }
  const textValues = [scenario.title, scenario.prompt, ...scenario.choices.map((choice) => choice.text)];
  if (textValues.some(scenarioTextHasUnsafeContent)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["prompt"], message: "scenario text contains unsafe operational content" });
  }
});
export const safeScenarioSchema = scenarioSchema;
export const scenarioRecordSchema = scenarioSchema;

export const scenarioDeliverySchema = z.object({
  scenario: scenarioSchema,
  generationMode: contentGenerationModeSchema,
  modelCallAttempted: z.boolean(),
  modelCallSucceeded: z.boolean(),
  fallbackReason: z.enum(["timeout", "refusal", "provider_error", "schema_invalid", "safety_rejection", "quota_rate_limit"]).nullable()
}).strict().superRefine((delivery, context) => {
  if (delivery.generationMode === "curated_fallback" && (delivery.modelCallAttempted !== true || delivery.modelCallSucceeded !== false || delivery.fallbackReason === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["generationMode"], message: "fallback delivery must prove a failed model attempt and reason" });
  }
  if (delivery.generationMode === "live_model" && (delivery.modelCallAttempted !== true || delivery.modelCallSucceeded !== true || delivery.fallbackReason !== null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["generationMode"], message: "live delivery must prove a successful model call" });
  }
});

export const transferScenarioSchema = z.object({
  transferId: activityIdSchema,
  sourceScenarioId: activityIdSchema,
  scenario: scenarioSchema,
  sourceConceptIds: z.array(conceptIdSchema).min(1).max(10),
  sourceInvariantIds: z.array(invariantIdSchema).min(1).max(20),
  unfamiliarContext: z.literal(true),
  context: contextSchema,
  assessmentRubricId: rubricIdSchema
}).strict().superRefine((transfer, context) => {
  if (transfer.scenario.scenarioId === transfer.sourceScenarioId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["scenario", "scenarioId"], message: "transfer scenario must be distinct from source" });
  }
  if (transfer.scenario.context !== transfer.context) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["context"], message: "transfer context must match nested scenario" });
  }
});

/* -------------------------------------------------------------------------- */
/* Teach-back request and structured misconception analysis                     */
/* -------------------------------------------------------------------------- */

export const teachBackModeSchema = z.enum(["text", "voice", "diagram", "step_by_step"]);
export const teachBackTextRequestSchema = z.object({
  mode: z.literal("text"),
  text: boundedTextSchema
}).strict();
export const teachBackVoiceRequestSchema = z.object({
  mode: z.literal("voice"),
  voiceSessionId: opaqueIdSchema,
  voiceConsentVersion: versionSchema
}).strict();
export const teachBackDiagramRequestSchema = z.object({
  mode: z.literal("diagram"),
  selectedLabels: z.array(shortTextSchema).min(1).max(20)
}).strict();
export const teachBackStepsRequestSchema = z.object({
  mode: z.literal("step_by_step"),
  steps: z.array(boundedTextSchema).min(1).max(20)
}).strict();
export const teachBackInputSchema = z.discriminatedUnion("mode", [
  teachBackTextRequestSchema,
  teachBackVoiceRequestSchema,
  teachBackDiagramRequestSchema,
  teachBackStepsRequestSchema
]);
export const teachBackRequestSchema = z.object({
  teachBackId: opaqueIdSchema,
  profileId: profileIdSchema,
  conceptId: conceptIdSchema,
  rubricId: rubricIdSchema,
  input: teachBackInputSchema,
  submittedAt: isoTimestampSchema,
  idempotencyKey: opaqueIdSchema
}).strict();

export const teachBackCorrectClaimSchema = z.object({
  claim: mediumTextSchema,
  invariantId: invariantIdSchema
}).strict();
export const teachBackPartialClaimSchema = z.object({
  claim: mediumTextSchema,
  missing: mediumTextSchema
}).strict();
export const teachBackMisconceptionSchema = z.object({
  claim: mediumTextSchema,
  misconceptionId: opaqueIdSchema,
  severity: misconceptionSeverityBandSchema
}).strict();
export const teachBackOutputSchema = z.object({
  teachBackId: opaqueIdSchema,
  profileId: profileIdSchema,
  conceptId: conceptIdSchema,
  correctClaims: z.array(teachBackCorrectClaimSchema).max(20),
  partialClaims: z.array(teachBackPartialClaimSchema).max(20),
  misconceptions: z.array(teachBackMisconceptionSchema).max(20),
  missingLinks: z.array(mediumTextSchema).max(20),
  targetedQuestion: mediumTextSchema,
  rubricVersion: z.string().trim().regex(/^rubric-[A-Za-z0-9._:-]+$/),
  evaluatedAt: isoTimestampSchema,
  generationMode: z.enum(["live_model", "curated_fallback"]),
  evidenceId: opaqueIdSchema
}).strict().superRefine((output, context) => {
  if (output.correctClaims.length + output.partialClaims.length + output.misconceptions.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["correctClaims"], message: "analysis must contain at least one claim" });
  }
});

export const teachBackFeedbackSchema = z.object({
  solid: mediumTextSchema,
  shaky: mediumTextSchema,
  unsafeMisconception: mediumTextSchema.nullable(),
  missingConnection: mediumTextSchema.nullable(),
  oneQuestion: mediumTextSchema
}).strict();

/* -------------------------------------------------------------------------- */
/* Review scheduling and future recall estimates                               */
/* -------------------------------------------------------------------------- */

export const reviewLevelSchema = z.enum(["recognition", "recall", "familiar_application", "transfer", "explanation"]);
export const reviewStatusSchema = z.enum(["scheduled", "due", "completed", "skipped"]);
export const reviewScheduleSchema = z.object({
  reviewId: opaqueIdSchema,
  profileId: profileIdSchema,
  conceptId: conceptIdSchema,
  status: reviewStatusSchema,
  level: reviewLevelSchema,
  scheduledAt: isoTimestampSchema,
  nextReviewAt: isoTimestampSchema,
  intervalDays: z.number().finite().min(1).max(60),
  memoryStabilityDays: z.number().finite().min(1).max(60),
  reason: mediumTextSchema,
  sourceEventIds: evidenceEventIdsSchema,
  createdAt: isoTimestampSchema
}).strict().superRefine((schedule, context) => {
  if (schedule.nextReviewAt < schedule.scheduledAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["nextReviewAt"], message: "next review cannot precede scheduled time" });
  }
});

export const recallEstimateSchema = z.object({
  label: z.literal("Estimated recall, not a guarantee"),
  profileId: profileIdSchema,
  conceptId: conceptIdSchema,
  estimatedRecall: scoreSchema,
  modelVersion: shortTextSchema,
  stabilityEstimateDays: z.number().finite().min(1).max(60),
  elapsedDays: nonNegativeFiniteSchema,
  observationCount: z.number().int().min(2).max(10_000),
  expectedReviewSchedule: z.array(isoTimestampSchema).min(1).max(20),
  generatedAt: isoTimestampSchema
}).strict();

/* -------------------------------------------------------------------------- */
/* Vertex evidence, failures, and truthful fallback                            */
/* -------------------------------------------------------------------------- */

export const aiFeatureSchema = z.enum(["adaptive_explanation", "teach_back_extraction"]);
export const generationModeSchema = z.enum(["live_model", "curated_fallback"]);
export const aiFailureReasonSchema = z.enum([
  "timeout",
  "refusal",
  "provider_error",
  "schema_invalid",
  "safety_rejection",
  "quota_rate_limit"
]);

const aiEvidenceCommon = {
  feature: aiFeatureSchema,
  provider: providerSchema,
  model: shortTextSchema,
  requestId: traceIdSchema,
  generatedAt: isoTimestampSchema,
  latencyMs: z.number().int().min(0).max(120_000),
  schemaValid: z.boolean(),
  safetyValid: z.boolean(),
  sourceConceptIds: z.array(conceptIdSchema).min(1).max(10),
  promptTemplateVersion: shortTextSchema
};

export const liveAiEvidenceSchema = z.object({
  ...aiEvidenceCommon,
  generationMode: z.literal("live_model"),
  modelCallAttempted: z.literal(true),
  modelCallSucceeded: z.literal(true),
  schemaValid: z.literal(true),
  safetyValid: z.literal(true)
}).strict();

export const fallbackAiEvidenceSchema = z.object({
  ...aiEvidenceCommon,
  generationMode: z.literal("curated_fallback"),
  modelCallAttempted: z.literal(true),
  modelCallSucceeded: z.literal(false),
  failureReason: aiFailureReasonSchema,
  fallbackLabel: z.literal("Curated fallback used because the live model was unavailable or its output was rejected."),
  schemaValid: z.literal(true),
  safetyValid: z.literal(true)
}).strict();

export const aiEvidenceSchema = z.discriminatedUnion("generationMode", [liveAiEvidenceSchema, fallbackAiEvidenceSchema]);

export const aiFailureSchema = z.object({
  failureId: opaqueIdSchema,
  feature: aiFeatureSchema,
  provider: providerSchema,
  model: shortTextSchema,
  requestId: traceIdSchema.optional(),
  reason: aiFailureReasonSchema,
  occurredAt: isoTimestampSchema,
  retryable: z.boolean(),
  safeMessage: shortTextSchema
}).strict();

export const fallbackContentSchema = z.object({
  generationMode: z.literal("curated_fallback"),
  modelCallAttempted: z.literal(true),
  modelCallSucceeded: z.literal(false),
  fallbackReason: aiFailureReasonSchema,
  label: z.literal("Curated fallback used because the live model was unavailable or its output was rejected."),
  contentId: opaqueIdSchema,
  sourceConceptIds: z.array(conceptIdSchema).min(1).max(10),
  validatedAt: isoTimestampSchema
}).strict();
export const fallbackSchema = fallbackContentSchema;

/* -------------------------------------------------------------------------- */
/* Analytics metrics and deterministic state-transition evidence                */
/* -------------------------------------------------------------------------- */

export const analyticsEventNameSchema = z.enum([
  "account_created",
  "household_created",
  "profile_created",
  "profile_selected",
  "constitution_updated",
  "diagnostic_started",
  "diagnostic_answered",
  "diagnostic_completed",
  "activity_recommended",
  "route_overridden",
  "scaffold_changed",
  "lesson_started",
  "hint_requested",
  "scenario_answered",
  "confidence_submitted",
  "teachback_submitted",
  "teachback_evaluated",
  "transfer_attempted",
  "transfer_succeeded",
  "transfer_failed",
  "concept_state_updated",
  "misconception_created",
  "misconception_updated",
  "review_scheduled",
  "review_completed",
  "model_call_started",
  "model_call_completed",
  "model_output_rejected",
  "fallback_used",
  "profile_exported",
  "profile_deleted"
]);

const eventCommonFields = {
  eventId: eventIdSchema,
  occurredAt: isoTimestampSchema,
  tenantId: householdIdSchema,
  profileId: profileIdSchema,
  sessionId: sessionIdSchema,
  conceptIds: z.array(conceptIdSchema).max(10).optional(),
  activityId: activityIdSchema.optional(),
  language: supportedLanguageSchema.optional(),
  modality: modalitySchema.optional(),
  correct: z.boolean().optional(),
  confidence: scoreSchema.optional(),
  responseTimeMs: boundedResponseTimeSchema.optional(),
  hintsUsed: z.number().int().min(0).max(20).optional(),
  schemaVersion: schemaVersionSchema,
  metadata: emptyMetadataSchema
};

const eventPayloadSchemas = {
  account_created: z.object({ authProvider: z.enum(["google", "password", "seeded_evaluator"]) }).strict(),
  household_created: z.object({ householdName: shortTextSchema }).strict(),
  profile_created: z.object({ ageBand: ageBandSchema }).strict(),
  profile_selected: z.object({ selectionReason: z.enum(["login", "switch", "deep_link"]) }).strict(),
  constitution_updated: z.object({ constitutionVersion: versionSchema }).strict(),
  diagnostic_started: z.object({ diagnosticId: activityIdSchema }).strict(),
  diagnostic_answered: z.object({ assessmentId: opaqueIdSchema, selectedChoiceId: opaqueIdSchema }).strict(),
  diagnostic_completed: z.object({ diagnosticId: activityIdSchema, score: scoreSchema }).strict(),
  activity_recommended: z.object({ recommendationId: opaqueIdSchema, route: routeKindSchema, scaffoldLevel: scaffoldLevelSchema }).strict(),
  route_overridden: z.object({ overrideId: opaqueIdSchema, route: routeKindSchema }).strict(),
  scaffold_changed: z.object({ overrideId: opaqueIdSchema, scaffoldLevel: scaffoldLevelSchema }).strict(),
  lesson_started: z.object({ lessonId: activityIdSchema }).strict(),
  hint_requested: z.object({ hintNumber: z.number().int().min(1).max(20) }).strict(),
  scenario_answered: z.object({ scenarioId: activityIdSchema, choiceId: opaqueIdSchema }).strict(),
  confidence_submitted: z.object({ assessmentId: opaqueIdSchema }).strict(),
  teachback_submitted: z.object({ teachBackId: opaqueIdSchema }).strict(),
  teachback_evaluated: z.object({ teachBackId: opaqueIdSchema, misconceptionCount: z.number().int().min(0).max(20) }).strict(),
  transfer_attempted: z.object({ transferId: activityIdSchema }).strict(),
  transfer_succeeded: z.object({ transferId: activityIdSchema }).strict(),
  transfer_failed: z.object({ transferId: activityIdSchema }).strict(),
  concept_state_updated: z.object({ transitionId: opaqueIdSchema, formulaVersion: shortTextSchema }).strict(),
  misconception_created: z.object({ misconceptionId: opaqueIdSchema, severity: scoreSchema }).strict(),
  misconception_updated: z.object({ misconceptionId: opaqueIdSchema, severity: scoreSchema }).strict(),
  review_scheduled: z.object({ reviewId: opaqueIdSchema, nextReviewAt: isoTimestampSchema }).strict(),
  review_completed: z.object({ reviewId: opaqueIdSchema, success: z.boolean() }).strict(),
  model_call_started: z.object({ feature: aiFeatureSchema, provider: providerSchema, model: shortTextSchema, requestId: traceIdSchema }).strict(),
  model_call_completed: z.object({ feature: aiFeatureSchema, provider: providerSchema, model: shortTextSchema, requestId: traceIdSchema, generationMode: generationModeSchema }).strict(),
  model_output_rejected: z.object({ feature: aiFeatureSchema, reason: aiFailureReasonSchema }).strict(),
  fallback_used: z.object({ feature: aiFeatureSchema, reason: aiFailureReasonSchema }).strict(),
  profile_exported: z.object({ exportId: opaqueIdSchema }).strict(),
  profile_deleted: z.object({ deletionId: opaqueIdSchema }).strict()
};

export const accountCreatedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("account_created"), payload: eventPayloadSchemas.account_created.optional() }).strict();
export const householdCreatedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("household_created"), payload: eventPayloadSchemas.household_created.optional() }).strict();
export const profileCreatedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("profile_created"), payload: eventPayloadSchemas.profile_created.optional() }).strict();
export const profileSelectedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("profile_selected"), payload: eventPayloadSchemas.profile_selected.optional() }).strict();
export const constitutionUpdatedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("constitution_updated"), payload: eventPayloadSchemas.constitution_updated.optional() }).strict();
export const diagnosticStartedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("diagnostic_started"), payload: eventPayloadSchemas.diagnostic_started.optional() }).strict();
export const diagnosticAnsweredEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("diagnostic_answered"), payload: eventPayloadSchemas.diagnostic_answered.optional() }).strict();
export const diagnosticCompletedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("diagnostic_completed"), payload: eventPayloadSchemas.diagnostic_completed.optional() }).strict();
export const activityRecommendedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("activity_recommended"), payload: eventPayloadSchemas.activity_recommended.optional() }).strict();
export const routeOverriddenEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("route_overridden"), payload: eventPayloadSchemas.route_overridden.optional() }).strict();
export const scaffoldChangedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("scaffold_changed"), payload: eventPayloadSchemas.scaffold_changed.optional() }).strict();
export const lessonStartedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("lesson_started"), payload: eventPayloadSchemas.lesson_started.optional() }).strict();
export const hintRequestedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("hint_requested"), payload: eventPayloadSchemas.hint_requested.optional() }).strict();
export const scenarioAnsweredEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("scenario_answered"), payload: eventPayloadSchemas.scenario_answered.optional() }).strict();
export const confidenceSubmittedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("confidence_submitted"), payload: eventPayloadSchemas.confidence_submitted.optional() }).strict();
export const teachbackSubmittedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("teachback_submitted"), payload: eventPayloadSchemas.teachback_submitted.optional() }).strict();
export const teachbackEvaluatedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("teachback_evaluated"), payload: eventPayloadSchemas.teachback_evaluated.optional() }).strict();
export const transferAttemptedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("transfer_attempted"), payload: eventPayloadSchemas.transfer_attempted.optional() }).strict();
export const transferSucceededEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("transfer_succeeded"), payload: eventPayloadSchemas.transfer_succeeded.optional() }).strict();
export const transferFailedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("transfer_failed"), payload: eventPayloadSchemas.transfer_failed.optional() }).strict();
export const conceptStateUpdatedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("concept_state_updated"), payload: eventPayloadSchemas.concept_state_updated.optional() }).strict();
export const misconceptionCreatedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("misconception_created"), payload: eventPayloadSchemas.misconception_created.optional() }).strict();
export const misconceptionUpdatedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("misconception_updated"), payload: eventPayloadSchemas.misconception_updated.optional() }).strict();
export const reviewScheduledEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("review_scheduled"), payload: eventPayloadSchemas.review_scheduled.optional() }).strict();
export const reviewCompletedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("review_completed"), payload: eventPayloadSchemas.review_completed.optional() }).strict();
export const modelCallStartedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("model_call_started"), payload: eventPayloadSchemas.model_call_started.optional() }).strict();
export const modelCallCompletedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("model_call_completed"), payload: eventPayloadSchemas.model_call_completed.optional() }).strict();
export const modelOutputRejectedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("model_output_rejected"), payload: eventPayloadSchemas.model_output_rejected.optional() }).strict();
export const fallbackUsedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("fallback_used"), payload: eventPayloadSchemas.fallback_used.optional() }).strict();
export const profileExportedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("profile_exported"), payload: eventPayloadSchemas.profile_exported.optional() }).strict();
export const profileDeletedEventSchema = z.object({ ...eventCommonFields, eventName: z.literal("profile_deleted"), payload: eventPayloadSchemas.profile_deleted.optional() }).strict();

export const analyticsEventSchema = z.discriminatedUnion("eventName", [
  accountCreatedEventSchema,
  householdCreatedEventSchema,
  profileCreatedEventSchema,
  profileSelectedEventSchema,
  constitutionUpdatedEventSchema,
  diagnosticStartedEventSchema,
  diagnosticAnsweredEventSchema,
  diagnosticCompletedEventSchema,
  activityRecommendedEventSchema,
  routeOverriddenEventSchema,
  scaffoldChangedEventSchema,
  lessonStartedEventSchema,
  hintRequestedEventSchema,
  scenarioAnsweredEventSchema,
  confidenceSubmittedEventSchema,
  teachbackSubmittedEventSchema,
  teachbackEvaluatedEventSchema,
  transferAttemptedEventSchema,
  transferSucceededEventSchema,
  transferFailedEventSchema,
  conceptStateUpdatedEventSchema,
  misconceptionCreatedEventSchema,
  misconceptionUpdatedEventSchema,
  reviewScheduledEventSchema,
  reviewCompletedEventSchema,
  modelCallStartedEventSchema,
  modelCallCompletedEventSchema,
  modelOutputRejectedEventSchema,
  fallbackUsedEventSchema,
  profileExportedEventSchema,
  profileDeletedEventSchema
]);
export const eventSchema = analyticsEventSchema;
export const eventEnvelopeSchema = analyticsEventSchema;
export const analyticsEventEnvelopeSchema = analyticsEventSchema;
export const eventNameSchema = analyticsEventNameSchema;

export const analyticsMetricNameSchema = z.enum([
  "verified_concept_state_gain",
  "delayed_retrieval_success",
  "transfer_success",
  "misconception_recurrence",
  "confidence_calibration",
  "hint_dependence"
]);
export const analyticsMetricSchema = z.object({
  metricId: opaqueIdSchema,
  name: analyticsMetricNameSchema,
  householdId: householdIdSchema.optional(),
  profileId: profileIdSchema.optional(),
  value: scoreSchema,
  sampleSize: z.number().int().min(0),
  derivedFromEventNames: z.array(analyticsEventNameSchema).min(1).max(20),
  lastUpdatedAt: isoTimestampSchema,
  emptyState: z.boolean(),
  seeded: z.boolean()
}).strict().superRefine((metric, context) => {
  if (metric.householdId === undefined && metric.profileId === undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["householdId"], message: "metric must be scoped to a household or profile" });
  }
  if (metric.emptyState && (metric.sampleSize !== 0 || metric.value !== 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["emptyState"], message: "empty metrics must have zero value and sample size" });
  }
  if (metric.sampleSize === 0 && !metric.emptyState) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["sampleSize"], message: "zero samples require an empty state" });
  }
});
export const analyticsMetricRecordSchema = analyticsMetricSchema;

export const stateSnapshotSchema = z.object({
  status: z.enum(["unassessed", "assessed"]).optional(),
  mastery: scoreSchema.nullable().optional(),
  uncertainty: scoreSchema.nullable().optional(),
  misconceptionSeverity: scoreSchema.nullable().optional(),
  memoryStabilityDays: z.number().finite().min(1).max(60).nullable().optional(),
  nextReviewAt: isoTimestampSchema.nullable().optional()
}).strict().superRefine((snapshot, context) => {
  if (Object.keys(snapshot).length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "state snapshot cannot be empty" });
  }
});

export const stateTransitionEvidenceSchema = z.object({
  transitionId: opaqueIdSchema,
  profileId: profileIdSchema,
  conceptId: conceptIdSchema,
  stateBefore: stateSnapshotSchema,
  stateAfter: stateSnapshotSchema,
  formulaVersion: z.string().trim().regex(/^[A-Za-z0-9._:-]+$/),
  inputEventIds: evidenceEventIdsSchema.min(1),
  reason: mediumTextSchema,
  transitionedAt: isoTimestampSchema
}).strict();
export const stateTransitionSchema = stateTransitionEvidenceSchema;
export const aiFailureModeSchema = aiFailureReasonSchema;

/* -------------------------------------------------------------------------- */
/* Inferred public types                                                        */
/* -------------------------------------------------------------------------- */

export type OpaqueId = z.infer<typeof opaqueIdSchema>;
export type AuthorizationRole = z.infer<typeof authorizationRoleSchema>;
export type AuthorizationSubject = z.infer<typeof authorizationSubjectSchema>;
export type AuthorizationScope = z.infer<typeof authorizationScopeSchema>;
export type AuthorizationDecision = z.infer<typeof authorizationDecisionSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
export type PublicRuntimeConfig = z.infer<typeof publicRuntimeConfigSchema>;
export type HouseholdCreateRequest = z.infer<typeof householdCreateRequestSchema>;
export type HouseholdRecord = z.infer<typeof householdRecordSchema>;
export type ProfileCreateRequest = z.infer<typeof profileCreateRequestSchema>;
export type ProfilePatchRequest = z.infer<typeof profilePatchRequestSchema>;
export type ProfileRecord = z.infer<typeof profileRecordSchema>;
export type AccessibilitySettings = z.infer<typeof accessibilitySettingsSchema>;
export type PersonalizationSignals = z.infer<typeof personalizationSignalsSchema>;
export type LearningConstitution = z.infer<typeof learningConstitutionSchema>;
export type ConstitutionRecord = z.infer<typeof constitutionRecordSchema>;
export type ConsentRecord = z.infer<typeof consentRecordSchema>;
export type InvariantRecord = z.infer<typeof invariantRecordSchema>;
export type Rubric = z.infer<typeof rubricSchema>;
export type Concept = z.infer<typeof conceptSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type ConceptGraph = z.infer<typeof conceptGraphSchema>;
export type LearnerState = z.infer<typeof learnerStateSchema>;
export type Misconception = z.infer<typeof misconceptionSchema>;
export type AssessmentRequest = z.infer<typeof assessmentRequestSchema>;
export type AssessmentRecord = z.infer<typeof assessmentRecordSchema>;
export type IdempotencyRequest = z.infer<typeof idempotencyRequestSchema>;
export type IdempotencyRecord = z.infer<typeof idempotencyRecordSchema>;
export type Route = z.infer<typeof routeSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type ScaffoldRecommendation = z.infer<typeof scaffoldRecommendationSchema>;
export type LearnerOverrideRequest = z.infer<typeof learnerOverrideRequestSchema>;
export type LearnerOverride = z.infer<typeof learnerOverrideRecordSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type ScenarioDelivery = z.infer<typeof scenarioDeliverySchema>;
export type TransferScenario = z.infer<typeof transferScenarioSchema>;
export type TeachBackRequest = z.infer<typeof teachBackRequestSchema>;
export type TeachBackOutput = z.infer<typeof teachBackOutputSchema>;
export type TeachBackFeedback = z.infer<typeof teachBackFeedbackSchema>;
export type ReviewSchedule = z.infer<typeof reviewScheduleSchema>;
export type RecallEstimate = z.infer<typeof recallEstimateSchema>;
export type AiEvidence = z.infer<typeof aiEvidenceSchema>;
export type AiFailure = z.infer<typeof aiFailureSchema>;
export type FallbackContent = z.infer<typeof fallbackContentSchema>;
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export type AnalyticsMetric = z.infer<typeof analyticsMetricSchema>;
export type StateTransitionEvidence = z.infer<typeof stateTransitionEvidenceSchema>;
