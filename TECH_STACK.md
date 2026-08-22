# SurakshaSutra Technology Stack

Live application: <https://sutra.dmj.one>

## Application stack

| Layer                       | Technology                                           | Use in SurakshaSutra                                                                                                                   |
| --------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend                    | Angular 21, TypeScript, RxJS, HTML, CSS              | Responsive PWA, learner profiles, diagnostic, adaptive lesson, simulator, teach-back, Memory Radar, analytics, and evidence UI         |
| Backend                     | NestJS 11, Node.js 22, TypeScript                    | Authenticated APIs, authorization, learner-state transitions, routing, validation, persistence, AI orchestration, and evidence records |
| Contracts                   | Zod and shared TypeScript packages                   | Runtime validation for profiles, lessons, scenarios, teach-back output, AI evidence, analytics, and API boundaries                     |
| Authentication              | Firebase Authentication / Google Identity Platform   | One-click Google login plus the public evaluator email/password journey                                                                |
| Operational data            | Google Cloud Firestore                               | Household, isolated profile, learner state, misconception, review, evidence, and event persistence                                     |
| Generative AI               | Google Vertex AI with `gemini-3.5-flash-lite`        | Adaptive explanation wording and structured teach-back claim extraction                                                                |
| Analytics                   | Persisted interaction events; BigQuery export target | Household learning metrics are computed from genuine stored events rather than decorative constants                                    |
| Hosting                     | Google Compute Engine                                | Production VM for the application containers and edge server                                                                           |
| Containers                  | Docker and Docker Compose                            | Reproducible Angular web and NestJS API deployment                                                                                     |
| Edge                        | Nginx                                                | Reverse proxy, TLS termination, CSP, security headers, API routing, and health endpoint                                                |
| TLS                         | Let's Encrypt / Certbot                              | Automatically renewable origin certificate for `sutra.dmj.one`                                                                         |
| DNS and CDN                 | Cloudflare                                           | Public DNS, proxy, HTTPS edge, and delivery for `sutra.dmj.one`                                                                        |
| Source control              | GitHub and the `gh` CLI                              | Version control, remote repository, and dependency alerts                                                                              |
| Package and quality tooling | pnpm, ESLint, Prettier, Vitest, TypeScript           | Builds, linting, formatting, unit tests, integration tests, and type checking                                                          |
| Runtime configuration       | Repository-local ignored `.env`                      | Deployment configuration and secrets; `.env` is mode `0600` and is never committed                                                     |

## How Generative AI is used

SurakshaSutra uses Vertex AI only at the generative edge:

1. **Adaptive explanation:** Gemini rewrites approved safety invariants for the selected language, route, and scaffold level.
2. **Teach-back extraction:** Gemini maps learner text into correct claims, partial claims, missing links, approved misconception IDs, severity, and one targeted question.

Every response is bounded, JSON-only, schema-validated, checked against allowlisted curriculum identifiers, safety-validated, and recorded with provider, model, request ID, latency, validation status, sources, and fallback status. If the model is unavailable or rejected, the application displays an explicitly labelled curated fallback.

The model does **not** control authentication, authorization, tenant/profile isolation, mastery, uncertainty, misconception updates, route eligibility, review scheduling, consent, retention, or analytics. Those operations remain deterministic application code.

## Connected adaptive-learning mechanisms

- Personal Learning Constitution with language, complexity, accessibility, session, consent, context, and personalization controls.
- Living Knowledge Twin with mastery, uncertainty, attempts, confidence, response time, misconceptions, stability, and review state.
- Confidence-aware adaptive diagnostic.
- Explainable Quick, Deep, and Low-Energy routes with learner override.
- Five-level Adaptive Scaffold Dial.
- Fictional, labelled `TRAINING SIMULATION` scenarios and transfer variations.
- Structured Teach-Back Misconception Debugger.
- Memory Radar retrieval scheduling based on stored learning history.
- System Evidence Drawer for AI calls and deterministic state transitions.
- Three independently persisted learner profiles under one household.

## Security and deployment notes

- Production secrets are read from `.env`; no secret value is committed to GitHub.
- Firebase browser keys are restricted by API and allowed referrer.
- Vertex credentials remain server-side and are never returned by public configuration endpoints.
- Firebase authorization and every profile-scoped API request are checked server-side.
- Nginx uses an explicit CSP, HTTPS, `same-origin-allow-popups` for Google authentication, and other browser security headers.
- AI output cannot introduce links, phone numbers, credentials, real institutions, executable markup, operational scam instructions, unknown curriculum IDs, or prompt-injection text.

## Related documentation

- [Production and recommended prompts](PROMPTS.md)
- [Submission answers](SUBMISSION_ANSWERS.md)
- [Video demonstration guide](VIDEO_DEMO_GUIDE.md)
- [Architecture decisions](orchestration/decisions.md)
- [Security policy](SECURITY.md)
