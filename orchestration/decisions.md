# Architecture Decisions

## ADR-001 — P0-only implementation

- Status: accepted
- Date: 2026-08-22
- Decision: Build only the connected P0 evaluator journey until every P0 release gate passes. P1 and P2 features remain absent from navigation and production code.
- Reason: `what-to-do.md` prioritizes fewer complete features and `idea.md` forbids P1 work before P0 verification.

## ADR-002 — New-repository technology defaults

- Status: accepted
- Date: 2026-08-22
- Decision: Use a strict TypeScript pnpm monorepo with an Angular PWA, NestJS API, shared runtime-validated contracts, Firestore persistence, Firebase/Identity Platform Google login, Vertex AI at the generative edge, and containerized GCE deployment.
- Reason: The repository has no existing application stack, so the defaults in `AGENTS.md` apply.

## ADR-003 — Deterministic core and generative edge

- Status: accepted
- Date: 2026-08-22
- Decision: Authorization, isolation, concept eligibility, learning-state formulas, route selection, review scheduling, analytics, and state transitions remain deterministic application code. Vertex AI may only adapt approved explanations and extract teach-back claims through strict schemas and policy validation.
- Reason: Prevent fabricated learning outcomes and preserve evaluator-auditable causality.

## ADR-004 — Deployment-first vertical ordering

- Status: accepted
- Date: 2026-08-22
- Decision: Establish the minimal production-shaped monorepo, authentication boundary, persistence abstraction, deployable containers, and public health route before completing the full UI journey. Tests follow implementation milestones but all required gates remain release blockers.
- Reason: The current human instruction makes a live application the priority while preserving all quality gates.

## ADR-005 — Current cloud credential constraint

- Status: accepted constraint
- Date: 2026-08-22
- Decision: Continue implementation and local production deployment on the current VM. Do not weaken Firebase, Firestore, or Vertex requirements. Provision `.env` from discoverable runtime values and record any remaining credential input needed from the human.
- Evidence: The attached service account token lacks `cloud-platform`, Firestore, and Vertex OAuth scopes; `gcloud services list` returns `ACCESS_TOKEN_SCOPE_INSUFFICIENT`.

## ADR-006 — Supported framework versions on the current VM

- Status: accepted
- Date: 2026-08-22
- Decision: Use Angular 21 LTS with NestJS 11 on Node.js 22.22.1 and pnpm 11.22.0.
- Reason: Angular 22 requires Node.js 22.22.3 or newer, while Angular 21 supports Node.js 22.12 or newer and remains in LTS through 2027. This avoids delaying deployment for a host runtime replacement.

## ADR-007 — Authentication and evaluator access

- Status: accepted
- Date: 2026-08-22
- Decision: Use Firebase Authentication for both Google one-click login and an isolated dummy evaluator email/password account. The NestJS API verifies every Firebase ID token and current household membership. There is no custom session or profile token. Every profile-scoped operation validates the Firebase subject, household membership, allowed profile ID, and stored object ownership server-side.
- Reason: This meets the Google-login and documented-credential requirements with one identity authority and avoids a second token system.

## ADR-008 — Seed and unassessed-state semantics

- Status: accepted
- Date: 2026-08-22
- Decision: Seed authentication, the three profile constitutions, and approved curriculum only. Learner state uses `status: unassessed` with null mastery, uncertainty, misconception severity, memory stability, and review timestamps. The first accepted observation uses an explicit effective mastery baseline of zero only inside the recorded formula evaluation.
- Reason: Prevent seeded schema examples from being misrepresented as learner evidence.

## ADR-009 — Versioned deterministic learning policy

- Status: accepted
- Date: 2026-08-22
- Decision: Freeze `adaptive-policy-v1` with: recurrence normalization `min(recurrenceCount / 2, 1)`; misconception levels low `<0.40`, medium `<0.70`, high `>=0.70`; prerequisite mastery `>=0.70`; low mastery `<0.50`; high misconception `>=0.70`; fast response `<=6000ms`; repeated hint dependence `>=2` hints across accepted attempts; stability initial `1 day`, successful delayed retrieval multiplier `1.8`, failed multiplier `0.6`, clamped to `1..60 days`; review intervals `1,3,7,14,30,60 days`; deterministic ties by descending risk weight then lexical concept ID.
- Decision: Observation uncertainty is confidence-calibration error (`correct ? 1-confidence : confidence`). Updated uncertainty is `clamp(previousOrOne*0.65 + observationUncertainty*0.35, 0, 1)`. Learner relevance is `1` for a constitution-context match and `0.5` otherwise. Graph importance is the approved concept `reviewImportance`.
- Reason: The organizer specification provides the core formulas but leaves these boundaries open. One inspectable, testable policy prevents agents from inventing divergent behavior.

## ADR-010 — Route and scaffold policy

- Status: accepted
- Date: 2026-08-22
- Decision: A high misconception or low mastery selects Deep Route; functional mastery with due review selects Quick Route; Low-Energy Route is selected only by explicit learner choice. An unassessed concept or mastery below `0.25` starts at scaffold 1; a high-confidence wrong answer/high misconception starts at scaffold 2; repeated hints move support down one level; correct-low-confidence uses level 2 followed by level 5; two fast correct contexts select level 5; otherwise level 4. Learner overrides always win and are audited.
- Reason: Preserve learner control and forbid inferred fatigue while making route/scaffold outcomes deterministic.

## ADR-011 — P0 AI and scenario boundary

- Status: accepted
- Date: 2026-08-22
- Decision: P0 uses curated validated simulator and transfer scenarios. Vertex is called only for an adapted explanation and structured teach-back extraction. Both use strict response schemas, allowlisted concept/rubric/invariant IDs, pre-display safety validation, a 12-second hard timeout, maximum one transient retry, and truthful curated fallback. Runtime model, location, token limits, and template versions are environment-configured.
- Reason: This is the smallest P0 that proves real generative adaptation without introducing unnecessary scenario-generation risk.

## ADR-012 — P0 data, analytics, and privacy

- Status: accepted
- Date: 2026-08-22
- Decision: Firestore is the production source of truth. Direct client Firestore access is denied; only the authenticated API writes state. State/event/misconception/review/evidence/idempotency records update transactionally. Household metrics are derived from persisted Firestore events; BigQuery export is asynchronous and must never block learning. Raw teach-back text and voice are not retained. Voice UI remains hidden in P0.
- Reason: Meet persistence, truthfulness, isolation, and privacy gates without coupling the evaluator path to analytics infrastructure.

## ADR-013 — Runtime bounds and evaluator failure injection

- Status: accepted
- Date: 2026-08-22
- Decision: Supported language codes are `hi`, `en`, `hinglish`, and `hi_en`; session duration is `3..15` minutes; confidence is `0..1`; response time is `0..120000ms`; teach-back input is at most `2000` Unicode characters; event evidence references are capped at 50 per state record. A per-request forced model-failure mode is accepted only for the configured evaluator identity when evaluator controls are enabled, and is recorded as test evidence.
- Reason: Bound resource use and provide the required truthful failure demonstration without a global production kill switch.
