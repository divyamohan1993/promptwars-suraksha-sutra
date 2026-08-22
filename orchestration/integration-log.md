# Integration Log

## 2026-08-22T07:13:40Z — Initial audit

- Read all governing requirements in the mandated order.
- Confirmed a clean, requirements-only `main` branch at `fe84bf6d3ae5a1477b36d9033283181de4fe8b2c`.
- Confirmed no application, package manager, tests, infrastructure, environment file, or deployment exists.
- Confirmed the current GCE VM is publicly addressed at `34.0.15.183`, has HTTP/HTTPS network tags, and currently exposes only SSH.
- Confirmed passwordless sudo is available; Node.js, pnpm, Docker, and a reverse proxy are absent.
- Confirmed attached-service-account access scopes are insufficient for Firestore, Vertex AI, or project administration.

## 2026-08-22T07:17:00Z — Wave A started

- Spawned Luna Max read-only task A1 for product traceability, learning science, curriculum invariants, and safety boundaries.
- Spawned Luna Max read-only task A2 for P0 UX, bilingual copy, and accessibility contracts.
- Spawned Luna Max read-only task A3 for GCP, security, privacy, IAM, and deployment analysis.

## 2026-08-22T07:21:30Z — VM foundation prepared

- Installed Node.js 22.22.1, npm, pnpm 11.22.0, Docker 29.1.3, Docker Compose 2.40.3, nginx 1.28.3, and Certbot.
- Enabled Docker and nginx; verified the Docker runtime by running the upstream `hello-world` image.
- Added the VM user to the Docker group for subsequent sessions.
- Selected Angular 21 LTS because it supports the installed Node.js release; verified current compatibility against Angular's official version table.

## 2026-08-22T07:21:45Z — Wave A specialist reviews completed

- A2 delivered the connected nine-screen P0 information architecture, exact Savita bilingual evaluator copy, semantic/focus/live-region behavior, truthful model/fallback/seeded/training badges, and test assertions.
- Accepted the recommendations to keep voice optional, use two compact diagnostic items, and expose an evaluator-only persisted model-failure trigger.
- A1 delivered sentence-level P0 traceability, contract fields, formula gaps, safe-scenario invariants, and contract/unit/integration/E2E assertions.
- A3 confirmed the GCE access-scope blocker and delivered the runtime IAM, Firebase authentication, server-side profile isolation, Firestore, Vertex, TLS, rollback, and threat-model contracts.
- Independently confirmed pnpm 11.22.0 currently runs successfully under Node.js 22.22.1; the transient A3 pnpm probe is not an active blocker.
- Spawned Luna Max read-only task A4 for independent monorepo, dependency, module-boundary, and contract-freeze synthesis.

## 2026-08-22T07:23:51Z — Wave A barrier passed

- Sol reconciled A1-A3 and recorded the accepted product, security, accessibility, data, and deterministic-policy decisions in ADR-007 through ADR-013.
- Stopped A4 after its extended review duplicated settled requirements; Sol froze the repository module graph and contract ownership directly.
- Persisted the review evidence and retained the known GCP/Firebase/TLS blockers.
- Advanced orchestration to Wave B foundation; schema contracts are now exclusively owned by B2 until Sol freezes them.

## 2026-08-22T07:25:33Z — Wave B started

- Created isolated branches/worktrees `agent/b1-monorepo`, `agent/b2-contracts`, and `agent/b3-curriculum` from `main@1dae084`.
- Spawned B1 for root/app/CI foundation, B2 as exclusive public Contract Agent, and B3 for approved curriculum and safety validation.
- Paths are disjoint; no agent may edit another ownership zone or orchestration files.

## 2026-08-22T07:28:16Z — Environment and TLS prepared

- Recovered the existing Firebase web configuration from the project's public Firebase Hosting initialization endpoint and populated the ignored `.env` with runtime configuration and newly generated evaluator/reset/analytics secrets.
- Verified the existing Firebase API key is expired through the Identity Toolkit API; authentication remains blocked until the key is renewed.
- Selected `suraksha.34-0-15-183.sslip.io`, verified it resolves to the VM, and issued a trusted Let's Encrypt certificate valid through 2026-11-20 with automatic renewal.
- Added reviewed bootstrap/HTTPS nginx templates, an edge installer, certificate verifier, and systemd container-service definition. The production proxy will be activated only after healthy application containers exist.

## 2026-08-22T07:40:40Z — Cloud data plane, authentication, and contracts ready

- Replaced the expired Firebase key with a dedicated browser key restricted to the production host, localhost, and the Firebase authentication APIs; enabled and live-tested Google one-click plus email/password sign-in.
- Added the public host to Identity Platform, created the isolated evaluator account, verified its credentials, and assigned only the evaluator custom claim. Secrets remain solely in the ignored mode-`0600` `.env`.
- Provisioned the delete-protected native Firestore database `suraksha`, regional BigQuery dataset `suraksha_sutra`, immutable-tag Artifact Registry repository, and least-privilege `suraksha-runtime` service account.
- Verified a live `gemini-3.5-flash-lite` Vertex call with the restricted service-account-bound API key. Verified an authenticated Firestore query with the `.env` service-account credential. Secret Manager is intentionally not used per current human instruction.
- Received B2 commit `42d4a971ed5a6e951a38fd3ad737c486f50363ee`, inspected its full schema surface and path ownership, independently passed strict typechecking, 20 contract tests with coverage, and build, then integrated it as `fd0bb0595890f7fad2772d30f7fe9cf7015eef04`.
- Public contracts are frozen. Further changes require Sol approval and an explicit change request.

## 2026-08-22T07:43:10Z — Foundation applications and curriculum integrated

- Received B1 commit `c6ad8718ee8b651f533a18cc10b0c66c663f56f2`, inspected root/app/CI changes and credential patterns, independently passed frozen install, format, lint, typecheck, four tests, and Angular/Nest production builds, then integrated it as `35a7aab`.
- Received B3 commit `8936a73976f1d965f999ab7815d258aad23abb23`, inspected all curriculum-only paths plus the fail-closed safety validator, and integrated it as `05dcb37` after contracts were frozen.
- Removed the Contract Agent's standalone package lock/workspace files, regenerated the single root lockfile, normalized the public `.env.example` to the accepted `.env` runtime contract, and formatted integrated contract sources under the root policy.

## 2026-08-22T07:47:00Z — Connected P0 implementation wave started

- Created isolated branches/worktrees and spawned Luna Max C1 for the deterministic adaptive engine, C2 for the authenticated Firestore/Vertex API, and C3 for the connected Angular evaluator UI. Ownership is disjoint and frozen contracts remain read-only.
- Added local production API/web container definitions, loopback-only port bindings, health checks, an HTTPS-gated deployment script, and explicit `.dockerignore` protection for `.env`.
- Added the repository threat model and severity policy covering the browser, authentication/profile isolation, deterministic engine, Firestore, Vertex, evaluator controls, analytics, secret handling, and deployment boundaries.

## 2026-08-22T07:50:00Z — Container preflight and dependency remediation

- Corrected the contract declaration output root after a real consumer build exposed that package exports pointed at `dist/index` while declarations were emitted under `dist/src`; contract and curriculum consumer builds now pass.
- Built both production images, started the loopback-bound API and web containers, verified API health, and corrected the web capability policy after nginx failed closed during startup. Both container endpoints respond locally.
- A production dependency audit found a high-severity vulnerable lodash version through `@nestjs/config`. Upgraded the workspace resolution to lodash `4.18.1`; `pnpm audit --prod --audit-level high` now reports no known vulnerabilities.

## 2026-08-22T07:54:50Z — Deterministic adaptive engine integrated

- Received C1 commit `c0b60e50c0250784cb2209484a1d66b462269b26`, inspected its full public API and ownership, and integrated it as `27069b1`.
- Independently passed strict typechecking, 22 deterministic-policy tests with 91.35% line and 97.72% function coverage, and the package build. Model-provided mastery is rejected by the engine boundary.
- Used the browser-verification workflow on the local production-shaped web container: page content rendered, no framework overlay or browser errors appeared, interactive semantics were present, and a screenshot was inspected. Full journey verification remains gated on C2/C3 integration.

## 2026-08-22T08:15:00Z — P0 release deployed and live-verified

- Integrated the authenticated Firestore/Vertex API and connected Angular evaluator workspace, then resolved module-runtime and client/API normalization defects.
- Passed API typecheck, 6 tests, and build; web typecheck, 2 tests, and build; contract, curriculum, and adaptive-engine builds.
- Deployed commit `0516aa6` to `https://suraksha.34-0-15-183.sslip.io`; both containers are healthy behind trusted HTTPS.
- Live Firebase login returned three isolated profiles. The journey produced an incorrect-confident diagnostic, severity 0.975 misconception, Deep Route, scaffold 2, review, and a real `gemini-3.5-flash-lite` result in 2408ms.
- Base and transfer scenarios, teach-back, deterministic mastery, Memory Radar, 18 persisted events, 6 metrics, reauthentication, profile isolation, and truthful forced fallback passed.
- Real-browser login through live lesson and labelled simulator delivery passed with no browser errors.
- Closed the reported Google authentication CSP violation by allowing inline authentication bootstrap execution only within the already restricted script policy; verified the active public response header after nginx reload.

## 2026-08-22T18:33:00Z — Public stack and prompt record published

- Ran an independent read-only Luna Max inventory of every production Vertex prompt, output boundary, fallback, and related public claim; confirmed that the deployed application has two runtime model prompts.
- Added `TECH_STACK.md` with the actually deployed frontend, backend, Firebase, Firestore, Vertex AI, GCE, Docker, Nginx, Let's Encrypt, Cloudflare, GitHub, configuration, deterministic-learning, and safety boundaries.
- Added `PROMPTS.md` with the verbatim deployed templates first, material non-secret human build prompts, and separately labelled recommended `prompt-v2` forms with untrusted-data handling, output schemas, and safety constraints.
- Corrected the README's stale Secret Manager wording, the video guide's public URL and GenAI description, and the submission answer so it describes only the inputs the current model prompt actually receives.
- Passed Prettier, diff, credential-pattern, prompt-source, and submission character-count checks; pushed documentation commit `61509b1`.
