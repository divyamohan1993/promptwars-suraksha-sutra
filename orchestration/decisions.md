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
