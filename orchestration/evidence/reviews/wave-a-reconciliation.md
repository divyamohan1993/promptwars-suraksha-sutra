# Wave A Reconciliation

Date: 2026-08-22

## Evidence reviewed

- A1 independently mapped P0 obligations to shared contracts, deterministic formulas, safety invariants, and exact test assertions.
- A2 independently specified the connected P0 screen flow, Savita Hindi/English copy, truthful live/fallback/seed/training labels, WCAG behavior, and accessibility assertions.
- A3 independently audited the current GCE host and produced the authentication, authorization, Firestore, Vertex, IAM, deployment, rollback, and threat-boundary contracts.
- Sol independently verified the empty repository, host tooling, current public IP/listeners, gcloud identity, OAuth-scope failure, and supported framework/runtime versions.
- A4 was stopped after it duplicated already-settled requirement review; Sol performed the repository architecture synthesis directly.

## Frozen product decisions

1. P0 only; voice and all P1/P2 navigation remain absent.
2. Firebase Authentication provides Google one-click login and dummy evaluator email/password login. The API verifies Firebase tokens and profile ownership on every request.
3. Seeded profiles contain constitutions only and remain explicitly unassessed.
4. Curated, schema-validated simulator and transfer scenarios are used for P0. Vertex is reserved for adapted explanation and teach-back extraction.
5. Firestore is the production source of truth. Dashboard metrics are derived from persisted events; BigQuery ingestion is asynchronous and non-blocking.
6. Learner-state, route, scaffold, misconception, review, analytics, authorization, and persistence rules are deterministic and versioned.
7. Fallback content is always visibly labelled and stores a real failure reason.

Detailed policy thresholds and bounds are frozen in ADR-007 through ADR-013 in `orchestration/decisions.md`.

## Frozen repository architecture

```text
apps/
  api/                    NestJS HTTP API and composition root
  web/                    Angular PWA
packages/
  contracts/              Sole source of runtime schemas and public types
  curriculum/             Approved concepts, invariants, rubrics, scenarios, copy
  adaptive-engine/        Pure deterministic learning rules
  data-access/            Firestore repository interfaces and implementation
  ai-gateway/             Vertex adapter, output/safety validation, fallback
  analytics/              Event validation and derived metrics
infra/
  docker/                 Production images
  nginx/                  Edge configuration
  firestore/              Rules, indexes, emulator configuration
scripts/                  Seed, reset, deploy, rollback, verification
tests/                    Cross-package integration, security, E2E, performance
```

Dependencies point inward to `contracts`; `adaptive-engine` and `curriculum` remain pure and cannot import application, persistence, Firebase, or Vertex modules. The API is the only composition root. The web client never imports server implementations or writes directly to Firestore.

## Contract freeze ownership

Only the Contract Agent may create or change these public schemas during Wave B:

- authorization subject and role model,
- API error envelope,
- household and profile,
- Personal Learning Constitution and consent,
- concept, invariant, rubric, and graph edges,
- learner concept state and state-transition evidence,
- misconception,
- assessment/event/idempotency envelope,
- route, recommendation, scaffold, and learner override,
- lesson/scenario/transfer,
- teach-back request/output,
- review schedule and recall estimate,
- AI evidence and generation/failure modes,
- analytics metrics and public runtime configuration.

After schema tests pass and Sol marks `contracts.status=frozen`, every change requires a recorded contract change request.

## Smallest connected evaluator flow

```text
login → household/profile → constitution → diagnostic + confidence
→ route/scaffold → live adapted lesson → simulator → transfer
→ teach-back → deterministic update/review → Knowledge Twin/evidence/analytics
→ profile switch → refresh/reauthenticate → forced failure/fallback
```

Every displayed value must come from persisted state, a current deterministic computation, an evidenced live model call, or a visibly labelled curated fallback/seed.

## Release blockers retained

- The VM service account OAuth ceiling still blocks Firestore and Vertex calls.
- Firebase web configuration and evaluator account provisioning are not available.
- A trusted HTTPS origin must be configured and registered with Firebase.
- Application code, containers, deployed journey evidence, and independent reviews remain to be completed.

