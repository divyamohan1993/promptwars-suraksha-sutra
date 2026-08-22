import { concepts } from './concepts.js';
import { requiredCopyKeys, uiCopy, profileCopy } from './copy.js';
import { CURRICULUM_ID_ALLOWLIST, BASE_SCENARIO_ID } from './ids.js';
import { invariants } from './invariants.js';
import { misconceptions } from './misconceptions.js';
import { rubrics } from './rubrics.js';
import { profileScenarioMap, scenarios } from './scenarios.js';
import { graphEdges } from './graph.js';
import { validateCurriculumSafety } from './safety-validator.js';
import type { CurriculumScenario, SafetyValidationResult } from './types.js';

export const expectedProfileContexts = {
  'profile-savita': ['pension', 'messaging', 'upi'],
  'profile-arjun': ['internship', 'gaming', 'online_shopping'],
  'profile-ramesh': ['small_business', 'qr_payments', 'customer_support'],
} as const;

export interface CurriculumIntegrityReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly safety: SafetyValidationResult;
}

const unique = (values: readonly string[]): boolean => new Set(values).size === values.length;

const checkScenarioTransfer = (
  baseScenario: CurriculumScenario,
  transfer: CurriculumScenario,
  errors: string[],
): void => {
  if (JSON.stringify(transfer.invariantIds) !== JSON.stringify(baseScenario.invariantIds)) {
    errors.push(`${transfer.scenarioId} does not preserve the base invariant IDs.`);
  }
  if (transfer.feedbackRubricId !== baseScenario.feedbackRubricId) {
    errors.push(`${transfer.scenarioId} does not preserve the base rubric.`);
  }
  if (
    transfer.safestChoiceId !== baseScenario.safestChoiceId ||
    transfer.safestAction.en !== baseScenario.safestAction.en
  ) {
    errors.push(`${transfer.scenarioId} does not preserve the safest action.`);
  }
  if (transfer.visual === baseScenario.visual) {
    errors.push(`${transfer.scenarioId} must use a visually distinct presentation.`);
  }
  if (transfer.kind !== 'transfer') {
    errors.push(`${transfer.scenarioId} must be marked as a transfer scenario.`);
  }
};

export const validateCurriculumIntegrity = (): CurriculumIntegrityReport => {
  const errors: string[] = [];
  const conceptIds = concepts.map((concept) => concept.conceptId);
  const invariantIds = invariants.map((invariant) => invariant.invariantId);
  const misconceptionIds = misconceptions.map((misconception) => misconception.misconceptionId);
  const rubricIds = rubrics.map((rubric) => rubric.rubricId);
  const scenarioIds = scenarios.map((scenario) => scenario.scenarioId);

  for (const [label, values] of [
    ['concept', conceptIds],
    ['invariant', invariantIds],
    ['misconception', misconceptionIds],
    ['rubric', rubricIds],
    ['scenario', scenarioIds],
  ] as const) {
    if (!unique(values)) {
      errors.push(`Duplicate ${label} IDs are not allowed.`);
    }
  }

  const conceptSet: ReadonlySet<string> = new Set(conceptIds);
  const invariantSet: ReadonlySet<string> = new Set(invariantIds);
  const misconceptionSet: ReadonlySet<string> = new Set(misconceptionIds);
  const rubricSet: ReadonlySet<string> = new Set(rubricIds);
  const scenarioSet: ReadonlySet<string> = new Set(scenarioIds);

  if (!unique(graphEdges.map((edge) => edge.edgeId))) {
    errors.push('Duplicate graph edge IDs are not allowed.');
  }
  for (const edge of graphEdges) {
    if (!conceptSet.has(edge.sourceConceptId) || !conceptSet.has(edge.targetConceptId)) {
      errors.push(`${edge.edgeId} points to an unknown graph concept.`);
    }
    if ('invariantId' in edge && !invariantSet.has(edge.invariantId)) {
      errors.push(`${edge.edgeId} points to an unknown graph invariant.`);
    }
  }

  for (const invariant of invariants) {
    if (!conceptSet.has(invariant.conceptId)) {
      errors.push(`${invariant.invariantId} points to an unknown concept.`);
    }
  }

  for (const concept of concepts) {
    for (const id of concept.invariantIds) {
      if (!invariantSet.has(id))
        errors.push(`${concept.conceptId} points to an unknown invariant ${id}.`);
    }
    for (const id of concept.prerequisites) {
      if (!conceptSet.has(id))
        errors.push(`${concept.conceptId} points to an unknown prerequisite ${id}.`);
    }
    for (const id of concept.misconceptionIds) {
      if (!misconceptionSet.has(id))
        errors.push(`${concept.conceptId} points to an unknown misconception ${id}.`);
    }
    if (!rubricSet.has(concept.rubricId))
      errors.push(`${concept.conceptId} points to an unknown rubric ${concept.rubricId}.`);
  }

  for (const misconception of misconceptions) {
    if (!conceptSet.has(misconception.conceptId))
      errors.push(`${misconception.misconceptionId} points to an unknown concept.`);
    for (const id of misconception.correctionInvariantIds) {
      if (!invariantSet.has(id))
        errors.push(
          `${misconception.misconceptionId} points to an unknown correction invariant ${id}.`,
        );
    }
  }

  for (const rubric of rubrics) {
    for (const id of rubric.conceptIds) {
      if (!conceptSet.has(id))
        errors.push(`${rubric.rubricId} points to an unknown concept ${id}.`);
    }
    for (const id of rubric.invariantIds) {
      if (!invariantSet.has(id))
        errors.push(`${rubric.rubricId} points to an unknown invariant ${id}.`);
    }
    if (rubric.criteria.some((criterion) => criterion.points <= 0)) {
      errors.push(`${rubric.rubricId} must have positive-point criteria.`);
    }
  }

  const scenarioMap = new Map(scenarios.map((scenario) => [scenario.scenarioId, scenario]));
  const baseScenario = scenarioMap.get(BASE_SCENARIO_ID);
  if (!baseScenario) {
    errors.push(`Missing base scenario ${BASE_SCENARIO_ID}.`);
  } else {
    if (baseScenario.kind !== 'base') errors.push('The base scenario must be marked base.');
    for (const transferId of baseScenario.transferScenarioIds) {
      const transfer = scenarioMap.get(transferId);
      if (!transfer) errors.push(`Base scenario points to missing transfer ${transferId}.`);
      else checkScenarioTransfer(baseScenario, transfer, errors);
    }
  }

  for (const scenario of scenarios) {
    if (scenario.trainingLabel !== 'TRAINING SIMULATION')
      errors.push(`${scenario.scenarioId} is missing TRAINING SIMULATION.`);
    if (!rubricSet.has(scenario.feedbackRubricId))
      errors.push(`${scenario.scenarioId} points to an unknown rubric.`);
    for (const id of scenario.conceptIds)
      if (!conceptSet.has(id))
        errors.push(`${scenario.scenarioId} points to unknown concept ${id}.`);
    for (const id of scenario.invariantIds)
      if (!invariantSet.has(id))
        errors.push(`${scenario.scenarioId} points to unknown invariant ${id}.`);
    if (scenario.choices.length < 2)
      errors.push(`${scenario.scenarioId} needs at least two choices.`);
    const safest = scenario.choices.find((choice) => choice.id === scenario.safestChoiceId);
    if (!safest || safest.classification !== 'safe')
      errors.push(`${scenario.scenarioId} has no safe safestChoiceId.`);
    if (
      scenario.constraints.activeLinks ||
      scenario.constraints.realOrganizations ||
      scenario.constraints.realPhoneNumbers ||
      scenario.constraints.realCredentials ||
      scenario.constraints.operationalFraudInstructions
    ) {
      errors.push(`${scenario.scenarioId} has an unsafe constraint.`);
    }
  }

  if (baseScenario) {
    const expectedTransfers = new Set(baseScenario.transferScenarioIds);
    for (const scenario of scenarios) {
      if (scenario.kind === 'transfer' && !expectedTransfers.has(scenario.scenarioId)) {
        errors.push(
          `${scenario.scenarioId} is a transfer but is not linked from the base scenario.`,
        );
      }
    }
  }

  for (const [profileId, scenarioIdsForProfile] of Object.entries(profileScenarioMap)) {
    const expectedContexts =
      expectedProfileContexts[profileId as keyof typeof expectedProfileContexts];
    if (!expectedContexts || scenarioIdsForProfile.length !== expectedContexts.length) {
      errors.push(`${profileId} does not have one scenario per required context.`);
      continue;
    }
    const contexts = scenarioIdsForProfile.map(
      (scenarioId) => scenarioMap.get(scenarioId)?.context,
    );
    for (const context of expectedContexts) {
      if (!contexts.includes(context))
        errors.push(`${profileId} is missing transfer context ${context}.`);
    }
    for (const scenarioId of scenarioIdsForProfile) {
      if (!scenarioSet.has(scenarioId))
        errors.push(`${profileId} points to an unknown scenario ${scenarioId}.`);
    }
  }

  for (const key of requiredCopyKeys) {
    for (const [language, copy] of Object.entries(uiCopy)) {
      if (!copy[key] || copy[key].trim().length === 0)
        errors.push(`Missing ${language}.${key} copy.`);
    }
    for (const [profileId, copy] of Object.entries(profileCopy)) {
      if (!copy[key] || copy[key].trim().length === 0)
        errors.push(`Missing ${profileId}.${key} copy.`);
    }
  }

  const safety = validateCurriculumSafety(
    { concepts, invariants, misconceptions, rubrics, scenarios, uiCopy },
    { allowlist: CURRICULUM_ID_ALLOWLIST },
  );
  if (!safety.safe) {
    errors.push(
      ...safety.violations.map((violation) => `Safety: ${violation.code} at ${violation.path}`),
    );
  }

  return { valid: errors.length === 0, errors, safety };
};

export const curriculumIntegrity = validateCurriculumIntegrity();

export const assertCurriculumIntegrity = (): void => {
  if (!curriculumIntegrity.valid) {
    throw new Error(`Curriculum integrity failed:\n${curriculumIntegrity.errors.join('\n')}`);
  }
};
