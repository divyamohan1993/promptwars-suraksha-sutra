# Hackathon Anti-Disqualification Operating Rules

## 1. Organizer rules

The organizer will perform hands-on functional evaluation after submission.

The following can disqualify the project regardless of appearance:

- static or hardcoded pages presented as functioning intelligence,
- mock or fake data presented as real output,
- AI responses presented as generated when no working model call occurred,
- false-positive features that work only in a rehearsed demonstration,
- inaccessible authentication without supplied test credentials,
- features that do not work end to end.

Therefore:

- every demonstrated feature must actually run,
- every GenAI feature must use a real working model call,
- evaluator credentials must be supplied,
- the complete deployed journey must be tested before submission,
- fewer complete features are preferred over many broken features.

## 2. Operational interpretation

### 2.1 Static and hardcoded output

Prohibited:

- hardcoded mastery percentages presented as calculated,
- hardcoded “personalized” recommendations selected by profile name,
- hardcoded analytics totals,
- prerecorded model responses presented as live,
- a static knowledge map that never changes,
- UI-only profile switching without isolated backend state,
- a success toast when persistence failed.

Allowed:

- curated lesson content,
- curated fallback scenarios,
- deterministic test fixtures,
- seeded evaluator accounts,
- predefined safe examples,

only when clearly labelled and processed through the same production logic as ordinary input.

### 2.2 Mock and seed data

Seed data may establish an evaluator account and initial profile history. It must never be presented as newly generated evidence.

Required labels:

- `Evaluator test account`
- `Seeded starting state`
- `Curated fallback`
- `Live model output`

Required command:

```bash
pnpm seed:demo
```

Required reset command:

```bash
pnpm reset:demo
```

If the repository uses another package manager, provide equivalent one-command operations and document them.

### 2.3 Real AI call

Every AI feature shown in P0 must:

1. call the configured model provider at runtime,
2. record provider, model, trace/request identifier, start time, end time, and status,
3. validate the response against a strict schema,
4. validate safety constraints,
5. store only safe metadata,
6. affect a real feature or state transition,
7. expose evidence in the System Evidence Drawer.

The following do not prove a real AI call:

- a loading spinner,
- delayed rendering,
- random selection from canned text,
- a server endpoint returning a constant,
- a mock SDK,
- a screenshot of a prior call,
- a log line written without provider evidence.

### 2.4 Fallback truthfulness

A fallback is required for reliability but must not be misrepresented.

Display:

```text
Curated fallback used because the live model was unavailable or its output was rejected.
```

Record one of:

- timeout,
- refusal,
- provider error,
- invalid schema,
- safety rejection,
- quota or rate limit.

A fallback may keep the lesson functional. It may not satisfy the requirement to prove that the demonstrated AI feature can make a real call; the evaluator path must show both successful live generation and truthful fallback.

### 2.5 False-positive prevention

A feature is not considered working merely because it succeeds on the seeded demonstration.

For every P0 feature, test:

- one seeded input,
- one previously unseen valid input,
- one boundary input,
- one invalid input,
- one dependency-failure path.

Examples:

- a new teach-back sentence not present in fixtures,
- a different confidence value,
- a profile with no prior history,
- an invalid model response,
- a Firestore retry,
- a model timeout.

### 2.6 Authentication access

Provide in the evaluator README:

- application URL,
- test email or username,
- test password,
- any second-factor bypass designed specifically for the dummy account,
- role and profile descriptions,
- reset instructions,
- known browser requirements.

Never provide a real person's account or reusable personal password.

## 3. Feature admission rule

A feature may appear in evaluator navigation only after all of the following exist:

- working frontend,
- working backend or deterministic local engine,
- persistence where required,
- authorization,
- input validation,
- error state,
- loading state,
- accessibility path,
- unit or contract tests,
- integration test,
- deployed smoke test,
- evidence artifact.

Otherwise hide or remove the feature from the submitted build. An empty menu item is not ambition; it is documented failure.

## 4. Required evidence for each demonstrated feature

Create a feature evidence record:

```json
{
  "featureId": "teachback-debugger",
  "status": "verified",
  "deployedUrl": "/learn/teachback",
  "testCredentialRole": "evaluator",
  "realModelCall": true,
  "modelEvidenceTraceId": "trace-id",
  "inputFixture": "safe fixture identifier",
  "novelInputTest": "test name",
  "stateBefore": "evidence path",
  "stateAfter": "evidence path",
  "automatedTests": ["test identifiers"],
  "manualTest": "evidence path",
  "fallbackVerified": true,
  "verifiedBy": "independent agent",
  "verifiedAt": "ISO-8601"
}
```

Store records under:

```text
orchestration/evidence/features/
```

## 5. System Evidence Drawer requirements

The evaluator-visible drawer must show safe proof, not developer theatre.

Required fields:

- live or fallback mode,
- actual provider/model,
- timestamp,
- latency,
- schema validation,
- safety validation,
- source concept IDs,
- learner-state evidence used,
- before/after state,
- deterministic update reason.

Prohibited fields:

- API key,
- hidden system prompt,
- private chain-of-thought,
- raw authentication token,
- another learner's data,
- full private message content.

## 6. Analytics truthfulness

Every dashboard value must be computed from persisted events or persisted learner state.

Required proof:

- metric definition,
- query or aggregation code,
- source event names,
- timestamp of last update,
- empty-state behaviour,
- test using known event fixtures.

Prohibited:

- constant percentages,
- random chart values,
- seeded totals presented as live programme impact,
- graphs that do not change after a qualifying interaction.

Seeded values, when displayed, must be visibly marked as seeded evaluator history.

## 7. Submission feature inventory

Maintain `orchestration/evidence/feature-inventory.md`:

| Feature | P0/P1/P2 | Live in UI | Real backend | Real model call | Tests pass | Deployed | Evidence | Submit? |
|---|---|---:|---:|---:|---:|---:|---|---:|

Rules:

- `Submit? = yes` only when every required column is verified.
- P1/P2 features may be removed from navigation without shame.
- A feature with a red gate cannot be described in the submission as implemented.

## 8. Evaluator preflight

Run from a fresh browser profile and a clean evaluator account:

1. Open the public application URL.
2. Log in using documented credentials.
3. Complete the exact P0 journey.
4. Use one novel valid input.
5. Refresh at three stateful points.
6. Log out and log back in.
7. Switch profiles and verify isolation.
8. Trigger a real model call.
9. Inspect the Evidence Drawer.
10. Trigger model failure and verify truthful fallback.
11. Inspect analytics after real events.
12. Run keyboard-only navigation.
13. Test a narrow viewport.
14. Confirm no console error blocks the flow.
15. Confirm no secret or private content appears in logs.
16. Reset the demo account and repeat.

The full journey must pass three times consecutively on the deployed environment.

## 9. Submission package requirements

Provide:

- public application URL,
- test credentials,
- concise evaluator route,
- repository URL,
- setup instructions,
- architecture summary,
- feature inventory,
- quality scorecard,
- security and privacy summary,
- known limitations,
- evidence screenshots or traces,
- demo reset instructions.

Known limitations must be honest. A disclosed non-critical limitation is survivable; a fake capability discovered by evaluators is not.

## 10. Final disqualification gate

Sol must block submission if any answer below is `no`:

- Does every visible P0 feature work end to end?
- Does every displayed AI output have evidence of a real model call or an explicit fallback label?
- Are all analytics computed from real stored state or clearly labelled seeded history?
- Do test credentials work from a fresh browser?
- Does novel valid input work?
- Does state persist after refresh and reauthentication?
- Are profiles isolated server-side?
- Does the deployed journey pass three consecutive times?
- Are unfinished features hidden?
- Are all Critical and High defects closed?

