import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BASE_SCENARIO_ID,
  curriculumIntegrity,
  expectedProfileContexts,
  profileScenarioMap,
  scenarios,
  transferScenarios,
} from '../src/index.js';

test('approved curriculum references are internally consistent and safe', () => {
  assert.equal(curriculumIntegrity.valid, true, curriculumIntegrity.errors.join('\n'));
  assert.equal(
    curriculumIntegrity.safety.safe,
    true,
    JSON.stringify(curriculumIntegrity.safety.violations),
  );
});

test('one base simulator links every required profile-context transfer', () => {
  const base = scenarios.find((scenario) => scenario.scenarioId === BASE_SCENARIO_ID);
  assert.ok(base);
  assert.equal(base.kind, 'base');
  assert.equal(base.transferScenarioIds.length, transferScenarios.length);

  const scenarioMap = new Map(scenarios.map((scenario) => [scenario.scenarioId, scenario]));
  for (const transferId of base.transferScenarioIds) {
    const transfer = scenarioMap.get(transferId);
    assert.ok(transfer, `Missing transfer scenario ${transferId}`);
    assert.deepEqual(transfer.invariantIds, base.invariantIds);
    assert.equal(transfer.feedbackRubricId, base.feedbackRubricId);
    assert.equal(transfer.safestChoiceId, base.safestChoiceId);
    assert.equal(transfer.safestAction.en, base.safestAction.en);
    assert.notEqual(transfer.visual, base.visual);
  }

  for (const [profileId, scenarioIds] of Object.entries(profileScenarioMap)) {
    const contexts = scenarioIds.map((scenarioId) => scenarioMap.get(scenarioId)?.context);
    for (const context of expectedProfileContexts[
      profileId as keyof typeof expectedProfileContexts
    ]) {
      assert.ok(contexts.includes(context), `${profileId} is missing ${context}`);
    }
  }
});
