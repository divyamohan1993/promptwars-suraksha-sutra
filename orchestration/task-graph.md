# Task Graph

## Wave A — Analysis

- A1: Product traceability, learning science, curriculum invariants, and safety boundaries.
- A2: UX, WCAG 2.2 AA, Hindi/English copy, and evaluator journey design.
- A3: GCP deployment, authentication, data isolation, privacy, and threat-model inputs.
- A4: Repository architecture and contract-freeze synthesis.

Barrier: Sol reconciles all reports and freezes shared contracts.

## Wave B — Foundation

- B1: Strict TypeScript monorepo and CI/build foundation.
- B2: Runtime contracts and API error/auth envelopes.
- B3: Seed curriculum, rubrics, and safety validator.
- B4: GCE container/reverse-proxy deployment foundation.

Barrier: install, build, typecheck, lint, contract tests, seed validation, and container validation pass.

## Wave C — Core engines

- C1: Identity, household, profile isolation, persistence.
- C2: Deterministic learner-state, misconception, route, scaffold, and review engines.
- C3: Vertex gateway, schema/safety validation, evidence, and fallback.
- C4: Analytics event pipeline and derived household metrics.

Barrier: unit and integration tests pass for each engine.

## Wave D — Connected P0 slice

- D1: Google login, household/profile selector, and constitution.
- D2: Diagnostic, recommendation, lesson, simulator, and transfer.
- D3: Teach-back, Knowledge Twin, Memory Radar, Evidence Drawer, and household analytics.
- D4: Reset/export/delete and fallback controls.

Barrier: the complete local evaluator journey passes.

## Wave E/F — Integration, deployment, independent verification

- E1: Integrate modules and deploy the production artifact to GCE.
- F1: Functional, security/privacy, LLM safety, accessibility, performance, and traceability reviews.
- F2: Fix blocking defects and obtain original-reviewer confirmation.
- F3: Run the deployed evaluator journey three consecutive times and sign off.

