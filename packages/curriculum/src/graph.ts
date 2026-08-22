import type { GraphEdge } from '@suraksha-sutra/contracts';

/** The approved prerequisite/assessment links used by the deterministic route engine. */
export const graphEdges = [
  {
    edgeId: 'edge-pause-money-direction',
    sourceConceptId: 'pause_before_action',
    targetConceptId: 'money_in_vs_money_out',
    edgeType: 'prerequisite_of',
    rationale: 'Pausing creates room to distinguish incoming money from an outgoing authorisation.',
  },
  {
    edgeId: 'edge-pause-independent-verification',
    sourceConceptId: 'pause_before_action',
    targetConceptId: 'independent_verification',
    edgeType: 'prerequisite_of',
    rationale: 'A learner must pause before selecting an independent check.',
  },
  {
    edgeId: 'edge-independent-money-direction',
    sourceConceptId: 'independent_verification',
    targetConceptId: 'money_in_vs_money_out',
    edgeType: 'related_to',
    rationale: "Direction checks are safer when the requester's identity is independently checked.",
  },
  {
    edgeId: 'edge-urgency-independent',
    sourceConceptId: 'urgency_and_authority',
    targetConceptId: 'independent_verification',
    edgeType: 'remediated_by',
    rationale: 'Independent verification repairs the belief that urgency proves authenticity.',
  },
  {
    edgeId: 'edge-remote-independent',
    sourceConceptId: 'remote_access_payment_risk',
    targetConceptId: 'independent_verification',
    edgeType: 'remediated_by',
    rationale: 'A separate channel helps a learner reject unrequested remote access.',
  },
  {
    edgeId: 'edge-money-assessed-direction',
    sourceConceptId: 'money_in_vs_money_out',
    targetConceptId: 'money_in_vs_money_out',
    edgeType: 'assessed_by',
    invariantId: 'inv-money-direction-01',
    rationale: 'The base and transfer simulator assess the direction invariant.',
  },
] as const satisfies readonly GraphEdge[];

export const curriculumGraphEdges = graphEdges;
