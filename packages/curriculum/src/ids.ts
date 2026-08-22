import type { CurriculumIdAllowlist } from './types.js';

export const CONCEPT_IDS = [
  'pause_before_action',
  'money_in_vs_money_out',
  'independent_verification',
  'urgency_and_authority',
  'remote_access_payment_risk',
] as const;

export const INVARIANT_IDS = [
  'inv-pause-01',
  'inv-money-direction-01',
  'inv-independent-verification-01',
  'inv-appearance-01',
  'inv-urgency-01',
  'inv-remote-access-01',
] as const;

export const MISCONCEPTION_IDS = [
  'pin_needed_to_receive_money',
  'appearance_proves_identity',
  'requester_channel_is_enough',
  'urgency_means_authenticity',
  'remote_access_makes_support_safer',
] as const;

export const RUBRIC_IDS = [
  'rubric_money_direction_v1',
  'rubric-independent-verification-v1',
] as const;

export const BASE_SCENARIO_ID = 'scenario-payment-001' as const;

export const TRANSFER_SCENARIO_IDS = [
  'scenario-savita-pension-001',
  'scenario-savita-messaging-001',
  'scenario-savita-upi-001',
  'scenario-job-014',
  'scenario-arjun-gaming-001',
  'scenario-arjun-online-shopping-001',
  'scenario-ramesh-small-business-001',
  'scenario-ramesh-qr-payments-001',
  'scenario-ramesh-customer-support-001',
] as const;

export const SCENARIO_IDS = [BASE_SCENARIO_ID, ...TRANSFER_SCENARIO_IDS] as const;

export const CURRICULUM_ID_ALLOWLIST: CurriculumIdAllowlist = {
  conceptIds: new Set(CONCEPT_IDS),
  invariantIds: new Set(INVARIANT_IDS),
  misconceptionIds: new Set(MISCONCEPTION_IDS),
  rubricIds: new Set(RUBRIC_IDS),
  scenarioIds: new Set(SCENARIO_IDS),
};

export type ConceptId = (typeof CONCEPT_IDS)[number];
export type InvariantId = (typeof INVARIANT_IDS)[number];
export type MisconceptionId = (typeof MISCONCEPTION_IDS)[number];
export type RubricId = (typeof RUBRIC_IDS)[number];
export type ScenarioId = (typeof SCENARIO_IDS)[number];
