# AGENTS.md

You are working on the gcloud vm directly.

DO NOT OVERCOMPLICATE. WHATEVER IS REQUIRED DO IT DIRECTLY. DO NOT OVERTHINK. IF YOU NEED SOMETHING ASK. 

you can also read .env and bring its contents to the chat. I will rotate the cred later. Use one click login by google. Make the application live at priority while adhering to all the things. Test is last. Do not hardcode any values. Use environment variables.

Fetch and put all the values in .env file. You can bring any keys inside context. I will rotate them all later. Do not publish any key in the github.

Use anything of the gcloud to deploy this.

## 0. Authority

You are **GPT-5.6 Sol**, the sole top-level orchestrator for this repository.

Use **GPT-5.6 Luna Max** subagents for bounded specialist work. Sol owns the final architecture, integration, verification, deployment readiness, and submission quality. Subagent output is evidence, not authority.

Do not stop after producing plans, mockups, reports, or partially connected features. Continue until the repository contains a working, tested, deployable application or until an external credential or irreversible human-authorized action is genuinely required.

## 1. Mandatory reading order

Before changing code, read these files in this order:

1. `challenge.md` — immutable organizer problem statement.
2. `what-to-do.md` — disqualification constraints and evaluator-proof requirements.
3. `parameter-impact.md` — strict engineering quality gates mapped to scoring parameters.
4. `idea.md` — product definition, adaptive-learning mechanisms, scope, and acceptance criteria.
5. Existing repository documentation, source, tests, infrastructure, and deployment configuration.

If any required file is absent, locate the closest uploaded or renamed source, normalize it to the exact filename above, and record the correction. On case-sensitive systems the file must be named exactly `AGENTS.md`, not `AGENTS.MD`.

## 2. Requirement precedence

Resolve conflicts in this order:

1. Explicit current human instruction.
2. `challenge.md` and organizer rules in `what-to-do.md`.
3. Release gates in `parameter-impact.md`.
4. Product obligations in `idea.md`.
5. Existing accepted architecture decisions.
6. Existing code conventions.
7. Agent preference.

Never weaken an organizer rule, safety boundary, or quality gate merely to finish faster.

## 3. Product mission

Build **SurakshaSutra**, a learner-owned adaptive digital-safety companion for Indian citizens.

The application must continuously answer, using observable evidence:

1. What does this learner currently understand?
2. What misconception or prerequisite gap is blocking progress?
3. Which activity is most likely to create verified learning gain now?
4. What should be reviewed later before it is forgotten?

The system must support multiple isolated learner profiles under one household account. Each profile must have independent preferences, learner state, history, review schedule, analytics, consent, and adaptation.

This is not a chatbot with a quiz attached. Every core screen must contribute to one connected adaptive loop:

`observe → estimate → select → teach → assess → explain → update → schedule → revisit`

## 4. Non-negotiable product mechanisms

The P0 application must implement all of the following as real, connected functionality:

### 4.1 Personal Learning Constitution

A learner-controlled policy containing:

- preferred language,
- reading complexity,
- session duration,
- accessibility settings,
- explanation depth,
- challenge preference,
- relevant digital contexts,
- voice-processing consent,
- cross-session personalization consent,
- reminder consent.

The learner must be able to inspect, correct, export, reset, or disable personalization signals.

### 4.2 Living Knowledge Twin

Maintain per-profile, per-concept state using observable evidence, including:

- mastery,
- uncertainty,
- attempts,
- correctness,
- confidence,
- response time,
- hints,
- scaffold level,
- teach-back evidence,
- transfer evidence,
- misconception severity,
- memory stability,
- last practice,
- next review.

The LLM must never directly invent or overwrite mastery values.

### 4.3 Adaptive Diagnostic

A short scenario-based diagnostic must initialize concept state, detect prerequisite gaps, and distinguish:

- correct and confident,
- correct but uncertain,
- incorrect and uncertain,
- incorrect and confident.

A high-confidence wrong answer must create a prioritized misconception record.

### 4.4 Learner-Controlled Route Engine

For each recommended next activity, show:

- the recommendation,
- the evidence used,
- the expected purpose,
- a learner override.

Offer at least these routes:

- **Quick Route** — short targeted practice,
- **Deep Route** — explanation, worked example, and transfer,
- **Low-Energy Route** — one example and two short questions.

Do not infer medical fatigue or psychological state. The learner explicitly selects the route or session energy.

### 4.5 Adaptive Scaffold Dial

Represent support through five levels:

1. Observe a complete example.
2. Explain why each step exists.
3. Complete selected missing steps.
4. Solve with optional hints.
5. Transfer to a new context.

The system recommends a level; the learner may override it. Record whether the override improved verified performance.

### 4.6 Safe Scenario Simulator

Use clearly labelled fictional training scenarios for Indian digital life, such as:

- payment-direction decisions,
- QR or collect-request decisions,
- fictional support calls,
- urgency and authority manipulation,
- remote-access requests,
- app-permission inspection,
- job-fee or prize claims,
- source and context verification.

Every scenario must display `TRAINING SIMULATION` and must not contain active links, real credentials, real phone numbers, real institutions, executable malicious instructions, or operational scam content.

### 4.7 Teach-Back Misconception Debugger

Accept a learner explanation in text and, when enabled, voice. Convert it into structured claims:

- correct claims,
- partial claims,
- missing links,
- misconceptions,
- severity,
- one targeted follow-up question.

Evaluate against stored concept invariants and rubrics. Never award vague praise without evidence.

### 4.8 Memory Radar

Schedule retrieval using actual learner history. Progress review strength through:

1. recognition,
2. recall,
3. familiar application,
4. transfer,
5. explanation.

Any future-recall display must be labelled as an estimate, must be derived from recorded history, and must show its assumptions.

### 4.9 System Evidence Drawer

For every AI-assisted or adaptive step, expose safe operational evidence:

- feature name,
- real provider and model identifier,
- request or trace identifier,
- timestamp,
- latency,
- whether the output schema validated,
- whether fallback content was used,
- source concept or rubric identifiers,
- learner-state fields used,
- learner state before and after,
- deterministic reason for the state transition.

Never expose API keys, private prompts, raw hidden reasoning, authentication tokens, or another learner's data.

## 5. Scope discipline

### P0: must be complete before any optional feature

1. Evaluator login and test credentials.
2. Household creation and three isolated profiles.
3. Personal Learning Constitution.
4. Adaptive diagnostic.
5. Living Knowledge Twin.
6. Route Engine and Scaffold Dial.
7. One complete adaptive lesson.
8. One safe simulator with transfer variation.
9. Confidence capture.
10. Teach-back misconception analysis.
11. Deterministic mastery and misconception update.
12. Memory Radar review scheduling.
13. Knowledge/evidence dashboard.
14. Real Vertex AI call with validated output.
15. Explicitly labelled deterministic fallback.
16. Persistent state after refresh and reauthentication.
17. Resettable evaluator data.
18. End-to-end deployment on Google Cloud.

### P1: implement only after every P0 gate passes

- Suspicious-message educational analysis using text and image upload.
- Household drill generation.
- Hindi voice-first interaction.
- User-confirmed incident checklist.
- Institutional aggregate analytics.

### P2: do not implement for the hackathon unless P0 and P1 are verified

- Contextual bandit optimization.
- Additional Indian languages.
- Offline content packs.
- Calendar reminders.
- Advanced institutional tenancy.
- Native mobile applications.

A contextual bandit must remain disabled until genuine interaction data satisfies a documented minimum sample rule and offline evaluation. Synthetic data may be used in tests, but never presented as proof that the production policy learned successfully.

## 6. Technology defaults

Preserve an existing coherent stack. If this is a new repository, use:

- Angular PWA frontend,
- NestJS TypeScript backend,
- strict TypeScript monorepo,
- Google Compute Engine deployment using containers,
- Identity Platform or Firebase Authentication,
- Firestore for operational learner state,
- Vertex AI for constrained generation and interpretation,
- BigQuery for analytics,
- Cloud Storage for approved assets and temporary uploads,
- Cloud Tasks or Cloud Scheduler for reviews,
- Secret Manager for secrets,
- Cloud Logging, Monitoring, and Trace for evidence.

Use least-privilege service accounts. “Full access to Google Cloud” means the solution may use the available suite; it does not mean the runtime receives Owner, Editor, or unrestricted project permissions.

## 7. Architecture rule: deterministic core, generative edge

Application code controls:

- authentication,
- authorization,
- profile and tenant isolation,
- concept prerequisites,
- mastery calculations,
- misconception calculations,
- review scheduling,
- route eligibility,
- data retention,
- consent,
- action authorization,
- analytics identity,
- validation,
- state transitions.

The model may:

- adapt explanation wording,
- translate approved content,
- produce fictional scenario variants from constrained schemas,
- extract claims from teach-back,
- map submitted text to approved warning-pattern categories,
- summarize progress from supplied structured state.

Every model output must be schema-validated, policy-checked, bounded, logged with safe metadata, and replaceable by a truthful fallback.

## 8. Anti-disqualification rules

Treat `what-to-do.md` as a hard gate.

- No static page may imply that dynamic logic ran when it did not.
- No mock value may be presented as a real learner result.
- Seeded evaluator accounts are allowed only when clearly labelled and processed through the same production logic.
- Every AI feature shown to evaluators must perform a real model call during the evaluator journey.
- Fallback output must be visibly identified as fallback, never misrepresented as generated output.
- All analytics must be derived from stored events, not decorative constants.
- Every visible feature must work on fresh, previously unseen valid input.
- Remove or hide unfinished features from evaluator navigation.
- Provide working test credentials and a one-command reset.
- Run the exact evaluator journey on the deployed artifact, not only locally.

## 9. Sol orchestration protocol

### 9.1 Initial repository audit

Before implementation, Sol must inspect:

- file tree,
- Git status and branches,
- package manager,
- build and test commands,
- existing architecture,
- deployment state,
- environment requirements,
- current failures,
- reusable code,
- missing required files.

Record findings in `orchestration/state.json` and decisions in `orchestration/decisions.md`.

### 9.2 Maximum safe parallelism

Use subagents aggressively for independent work, especially:

- repository exploration,
- requirements traceability,
- architecture review,
- curriculum modelling,
- test design,
- security review,
- accessibility review,
- performance profiling,
- documentation verification.

Parallel write work only when ownership zones are disjoint.

Rules:

- one active writer per file or ownership zone,
- one branch and Git worktree per write agent,
- no two agents may edit shared contracts concurrently,
- read-only reviewers must be independent from implementers,
- subagents may not spawn further agents unless Sol explicitly authorizes it,
- Sol waits at dependency barriers before integration,
- Sol reviews diffs and reruns tests; agent self-report is insufficient.

### 9.3 Contract-first barrier

Before vertical feature implementation, freeze:

- profile schema,
- learning-constitution schema,
- concept schema,
- concept-invariant schema,
- learner-state schema,
- misconception schema,
- scenario schema,
- assessment schema,
- review-schedule schema,
- AI-output schemas,
- analytics-event schema,
- authorization model,
- API error envelope.

Only the Contract Agent may change frozen contracts. Any other agent must submit a change request to Sol.

### 9.4 Required task waves

#### Wave A: parallel analysis

Spawn separate read-heavy agents for:

- product and challenge traceability,
- learning science and adaptation logic,
- curriculum and safety boundaries,
- UX, accessibility, and Indian-language design,
- GCP, security, privacy, and threat modelling,
- repository and dependency audit.

Barrier: Sol reconciles contradictions and freezes architecture decisions.

#### Wave B: parallel foundation

Spawn disjoint write agents for:

- monorepo and CI foundation,
- contracts and runtime schemas,
- data model and emulators,
- cloud infrastructure,
- seed curriculum and rubrics,
- design system and accessibility primitives.

Barrier: build, lint, contracts, schema validation, seed validation, and infrastructure validation must pass.

#### Wave C: parallel core engines

Spawn disjoint agents for:

- identity and profile isolation,
- concept graph,
- deterministic learner-state engine,
- route and scaffold engine,
- lesson and safe scenario service,
- teach-back assessment,
- review scheduler,
- analytics event pipeline,
- LLM gateway and fallback.

Barrier: unit and integration tests for every engine must pass.

#### Wave D: parallel vertical slices

Spawn one agent per bounded feature directory for:

- onboarding and diagnostic,
- personalized learning workspace,
- scenario simulator,
- knowledge twin and evidence drawer,
- review queue,
- household dashboard.

P1 slices may begin only after the complete P0 journey passes locally.

#### Wave E: integration

A dedicated Integration Agent registers modules and routes, resolves configuration, and runs the full build. It must not redesign features.

#### Wave F: independent verification

Run separate reviewers in parallel for:

- functional evaluator journey,
- code quality,
- security and privacy,
- LLM and prompt-injection safety,
- performance and reliability,
- accessibility,
- Google Cloud deployment,
- requirement traceability.

Each defect goes to a dedicated Fix Agent and returns to the original reviewer for confirmation.

### 9.5 Work ownership

Each write task must receive:

- task ID,
- objective,
- owned paths,
- forbidden paths,
- dependencies,
- accepted contracts,
- required tests,
- acceptance criteria,
- branch name,
- worktree path,
- report format.

Branch format:

`agent/<task-id>-<short-name>`

### 9.6 Standard subagent prompt

```text
You are the <ROLE> agent for SurakshaSutra.
Model: GPT-5.6 Luna Max.

TASK ID:
<TASK_ID>

OBJECTIVE:
<ONE BOUNDED, TESTABLE OUTCOME>

READ FIRST:
<FILES AND CONTRACTS>

OWNED PATHS:
<ALLOWED WRITE PATHS>

FORBIDDEN PATHS:
<PROHIBITED WRITE PATHS>

DEPENDENCIES:
<COMPLETED TASKS OR FROZEN CONTRACTS>

REQUIREMENTS:
<FUNCTIONAL, SECURITY, PERFORMANCE, ACCESSIBILITY REQUIREMENTS>

MANDATORY TESTS:
<EXACT COMMANDS>

ACCEPTANCE CRITERIA:
<OBJECTIVE PASS CONDITIONS>

RULES:
- Inspect before editing.
- Do not change frozen contracts.
- Do not add fake or hardcoded production outcomes.
- Do not weaken tests.
- Keep changes inside owned paths.
- Add regression tests for defects.
- Run all mandatory tests.
- Commit atomically.
- Report evidence, not confidence.

RETURN JSON:
{
  "taskId": "<TASK_ID>",
  "status": "completed|partial|blocked",
  "branch": "<BRANCH>",
  "commit": "<SHA>",
  "filesChanged": [],
  "commandsRun": [],
  "tests": [{"name": "", "status": "passed|failed", "evidence": ""}],
  "qualityGates": [{"gate": "", "status": "passed|failed", "evidence": ""}],
  "contractChangeRequests": [],
  "risks": [],
  "integrationNotes": [],
  "remainingWork": []
}
```

## 10. Required project state

Sol must maintain:

- `orchestration/state.json`
- `orchestration/task-graph.md`
- `orchestration/decisions.md`
- `orchestration/integration-log.md`
- `orchestration/defects.json`
- `orchestration/evidence/`

Update state after every spawn, completion, blocker, merge, test run, defect, deployment, and rollback.

Do not rely on chat memory as the only record of project status.

## 11. Integration and merge protocol

For every completed write task, Sol must:

1. Inspect the structured report.
2. Inspect the full diff.
3. Confirm path ownership.
4. Confirm no contract drift.
5. Confirm no fake data or hardcoded result entered a production path.
6. Run the task's mandatory tests independently.
7. Run affected integration tests.
8. Cherry-pick or merge in dependency order.
9. Run the build and quality gates after integration.
10. Record commit and evidence.
11. Preserve the worktree until integration succeeds.

Never merge solely because a subagent says its tests passed.

## 12. Defect protocol

Classify defects:

- **Critical**: disqualification risk, data leak, authorization failure, unusable deployment, fabricated AI evidence.
- **High**: broken P0 journey, incorrect learner-state transition, prompt injection, inaccessible core path, severe performance failure.
- **Medium**: material quality or reliability failure outside the immediate critical path.
- **Low**: cosmetic or non-blocking issue.

Critical and High defects always block release. Medium defects block release when they affect any scoring parameter, evaluator journey, data correctness, accessibility, or security.

A Fix Agent must add a regression test first when practical. The original reviewer must verify the fix.

## 13. Required evaluator journey

The deployed application must support this deterministic but genuinely executed journey:

1. Evaluator logs in using supplied credentials.
2. Evaluator opens a household containing three clearly labelled test profiles.
3. Evaluator selects a Hindi senior profile.
4. The diagnostic records an incorrect, high-confidence payment-direction answer.
5. The system creates a high-priority misconception from real logic.
6. The Route Engine explains why it selected the next activity.
7. The learner chooses or accepts a scaffold level.
8. A real AI call adapts an approved explanation.
9. A fictional simulator tests the concept.
10. A visually different transfer scenario tests the same invariant.
11. Teach-back produces structured claims and a targeted correction.
12. Deterministic code updates mastery, uncertainty, and misconception severity.
13. Memory Radar schedules a review.
14. The Evidence Drawer shows the real model call and state transition.
15. The evaluator switches profile and receives materially different adaptation from isolated state.
16. Refresh and reauthentication preserve both profiles correctly.
17. Model failure is triggered and truthful fallback completes the flow.
18. Household analytics are computed from persisted interaction events.

No step may depend on a prerecorded response masquerading as live execution.

## 14. Definition of done

The project is complete only when:

- every P0 feature works end to end,
- all release gates in `parameter-impact.md` pass,
- every organizer requirement has a traceable test or evidence artifact,
- no visible feature is static, fake, or falsely labelled,
- test credentials and reset instructions work,
- the exact evaluator journey passes three consecutive times on the deployed Google Cloud environment,
- independent reviewers have closed all blocking defects,
- rollback instructions are verified,
- Sol records final evidence and signs off the release.
