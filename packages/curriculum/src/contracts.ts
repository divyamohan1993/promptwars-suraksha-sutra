/*
 * Contract adapters
 * -----------------
 * The rich, localized objects above are authoring data. These adapters are the
 * only place that narrows them to the shared public contract types. They keep
 * localized copy, visual hints, and feedback helpers out of persisted learner
 * records while preserving the IDs and safety-critical facts.
 */
import type {
  Concept,
  FallbackContent,
  GraphEdge,
  InvariantRecord,
  Rubric,
  Scenario,
  TeachBackOutput,
  TransferScenario,
} from '@suraksha-sutra/contracts';
import { concepts } from './concepts.js';
import { fallbackTeachBack } from './fallback.js';
import { graphEdges } from './graph.js';
import { invariants } from './invariants.js';
import { rubrics } from './rubrics.js';
import { scenarios } from './scenarios.js';
import type { CurriculumScenario } from './types.js';

const invariantById = new Map(invariants.map((invariant) => [invariant.invariantId, invariant]));

export const contractInvariants: readonly InvariantRecord[] = invariants.map((invariant) => ({
  invariantId: invariant.invariantId,
  conceptId: invariant.conceptId,
  statement: invariant.statement.en,
  safetyCritical: true,
}));
export const invariantRecords = contractInvariants;

export const contractConcepts: readonly Concept[] = concepts.map((concept) => ({
  conceptId: concept.conceptId,
  name: concept.name.en,
  learningObjective: concept.learningObjective.en,
  invariants: concept.invariantIds.map(
    (invariantId) => invariantById.get(invariantId)?.statement.en ?? '',
  ),
  invariantIds: [...concept.invariantIds],
  prerequisites: [...concept.prerequisites],
  misconceptionIds: [...concept.misconceptionIds],
  contexts: [...concept.contexts],
  riskWeight: concept.riskWeight,
  reviewImportance: concept.reviewImportance,
  rubricId: concept.rubricId,
  safetyClassification: concept.safetyClassification,
}));
export const conceptRecords = contractConcepts;

export const contractRubrics: readonly Rubric[] = rubrics.map((rubric) => {
  const totalPoints = rubric.criteria.reduce((sum, criterion) => sum + criterion.points, 0);
  return {
    rubricId: rubric.rubricId,
    version: 1,
    conceptId: rubric.conceptIds[0] ?? 'independent_verification',
    criteria: rubric.criteria.map((criterion) => ({
      criterionId: criterion.criterionId,
      label: criterion.description.en,
      requiredInvariantIds: [...rubric.invariantIds.filter((id) => id !== 'inv-pause-01')],
      weight: criterion.points / totalPoints,
    })),
    passingScore: 0.7,
  };
});
export const rubricRecords = contractRubrics;

const channelMap: Readonly<Record<CurriculumScenario['channel'], Scenario['channel']>> = {
  fictional_chat: 'fictional_chat',
  fictional_notice: 'fictional_message',
  fictional_notification: 'fictional_app',
  fictional_call_summary: 'fictional_call',
};

const manipulationMap: Readonly<Record<string, Scenario['manipulationPatterns'][number]>> = {
  urgency: 'urgency',
  claimed_authority: 'authority',
  authority: 'authority',
  familiar_appearance: 'appearance',
  appearance: 'appearance',
  reward: 'reward',
};

const contractContext = (scenario: CurriculumScenario): Scenario['context'] => {
  if (scenario.context === 'small_merchant') return 'small_business';
  if (scenario.context === 'payment_direction') return 'upi';
  return scenario.context;
};

const toContractScenario = (scenario: CurriculumScenario): Scenario => ({
  scenarioId: scenario.scenarioId,
  trainingLabel: scenario.trainingLabel,
  title: scenario.title.en,
  conceptIds: [...scenario.conceptIds],
  invariantIds: [...scenario.invariantIds],
  context: contractContext(scenario),
  channel: channelMap[scenario.channel],
  manipulationPatterns: scenario.manipulationPatterns.map(
    (pattern) => manipulationMap[pattern] ?? 'appearance',
  ),
  unsafeRequestCategory: scenario.unsafeRequestCategory,
  prompt: scenario.prompt.en,
  choices: scenario.choices.map((choice) => ({
    id: choice.id,
    text: choice.text.en,
    classification: choice.classification,
  })),
  safestChoiceId: scenario.safestChoiceId,
  feedbackRubricId: scenario.feedbackRubricId,
  transferScenarioIds: [...scenario.transferScenarioIds],
  constraints: { ...scenario.constraints },
});

export const contractScenarios: readonly Scenario[] = scenarios.map(toContractScenario);
export const scenarioRecords = contractScenarios;

const contractScenarioById = new Map(
  contractScenarios.map((scenario) => [scenario.scenarioId, scenario]),
);
const baseContractScenario = contractScenarioById.get('scenario-payment-001');

export const contractTransferScenarios: readonly TransferScenario[] = scenarios
  .filter((scenario) => scenario.kind === 'transfer')
  .map((scenario) => ({
    transferId: scenario.scenarioId,
    sourceScenarioId: 'scenario-payment-001',
    scenario: contractScenarioById.get(scenario.scenarioId) ?? toContractScenario(scenario),
    sourceConceptIds: [...(baseContractScenario?.conceptIds ?? scenario.conceptIds)],
    sourceInvariantIds: [...(baseContractScenario?.invariantIds ?? scenario.invariantIds)],
    unfamiliarContext: true,
    context: contractContext(scenario),
    assessmentRubricId: scenario.feedbackRubricId,
  }));
export const transferScenarioRecords = contractTransferScenarios;

export const contractGraphEdges: readonly GraphEdge[] = graphEdges.map((edge) => ({ ...edge }));

export const makeFallbackContent = (input: {
  readonly contentId: string;
  readonly fallbackReason: FallbackContent['fallbackReason'];
  readonly validatedAt: string;
}): FallbackContent => ({
  generationMode: 'curated_fallback',
  modelCallAttempted: true,
  modelCallSucceeded: false,
  fallbackReason: input.fallbackReason,
  label: 'Curated fallback used because the live model was unavailable or its output was rejected.',
  contentId: input.contentId,
  sourceConceptIds: ['money_in_vs_money_out', 'independent_verification'],
  validatedAt: input.validatedAt,
});

export const makeFallbackTeachBackOutput = (input: {
  readonly teachBackId: string;
  readonly profileId: string;
  readonly conceptId: string;
  readonly evaluatedAt: string;
  readonly evidenceId: string;
  readonly generationMode?: 'curated_fallback';
}): TeachBackOutput => ({
  teachBackId: input.teachBackId,
  profileId: input.profileId,
  conceptId: input.conceptId,
  correctClaims: fallbackTeachBack.correctClaims.map((claim) => ({ ...claim })),
  partialClaims: fallbackTeachBack.partialClaims.map((claim) => ({ ...claim })),
  misconceptions: fallbackTeachBack.misconceptions.map((misconception) => ({ ...misconception })),
  missingLinks: [...fallbackTeachBack.missingLinks],
  targetedQuestion: fallbackTeachBack.targetedQuestion.en,
  rubricVersion: fallbackTeachBack.rubricVersion,
  evaluatedAt: input.evaluatedAt,
  generationMode: input.generationMode ?? 'curated_fallback',
  evidenceId: input.evidenceId,
});
