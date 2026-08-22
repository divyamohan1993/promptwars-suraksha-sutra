# Parameter Impact and Industrial Quality Gates

## 1. Organizer-provided impact model

The organizer supplied qualitative impact levels, not exact numeric weights.

| Impact | Parameters |
|---|---|
| High | Code Quality; Problem Statement Alignment |
| Medium | Security; Efficiency |
| Low | Testing; Accessibility |

Do not invent organizer percentages. Treat the impact labels as implementation priority, while still requiring all six parameters to pass. A Low-impact parameter is not optional; it can decide close rankings and can expose failures in the higher-impact categories.

## 2. Normative and industry reference baseline

Use the following references as the engineering baseline applicable to this project:

- ISO/IEC 25010:2023 — software product quality model.
- SonarQube Clean as You Code / Standard Quality Gate concepts for new code.
- OWASP Application Security Verification Standard 5.0.0, target Level 2 for applicable controls.
- OWASP Top 10:2025 for web application risks.
- OWASP API Security Top 10:2023.
- OWASP Large Language Model Security Verification Standard 2.0 for LLM integration.
- NIST SP 800-218 SSDF 1.1 and NIST SP 800-218A for AI-specific secure development practices.
- WCAG 2.2 Level AA.
- Google Core Web Vitals good thresholds at the 75th percentile.
- Google Cloud Well-Architected Framework for security, reliability, performance, cost, and operations.

These references define the direction. The measurable project gates below define release acceptance.

## 3. Gate status vocabulary

```text
PASS       Requirement is met with reproducible evidence.
FAIL       Requirement is not met.
BLOCKED    External dependency prevents measurement; release remains blocked.
NOT_APPLICABLE
           Requirement is genuinely irrelevant and has a written justification approved by Sol.
```

No gate may be marked PASS based only on an agent statement. Evidence must be a test result, report, trace, deployed observation, or inspected configuration.

---

# 4. High Impact: Problem Statement Alignment

## 4.1 Intent

The application must understand an evolving learner state and use it to deliver a personalized, connected learning experience. This parameter is not satisfied by a chatbot, static quiz, decorative analytics, or isolated AI features.

## 4.2 Mandatory criteria

### PSA-01 Requirement traceability

- Maintain a traceability matrix from every sentence-level obligation in `challenge.md` to:
  - product mechanism,
  - implementation module,
  - acceptance criterion,
  - automated or manual evidence.
- Coverage for P0 obligations: **100%**.
- Unmapped P0 obligation: **release blocker**.

### PSA-02 Evolving learner state

The application must persist and update, per profile and per concept:

- mastery,
- uncertainty,
- misconception severity,
- confidence calibration,
- scaffold level,
- transfer evidence,
- memory stability,
- review date.

At least three different interaction types must affect state:

1. direct assessment,
2. transfer assessment,
3. teach-back or delayed retrieval.

### PSA-03 Personalization causality

A recommendation must be traceable to recorded learner evidence.

Required test:

- Create two profiles with different valid interaction histories.
- Request the next activity for the same target domain.
- The system must produce a materially different route, scaffold, context, timing, or explanation depth.
- The Evidence Drawer must state why.

Hardcoded profile-name branching is prohibited.

### PSA-04 Connected workflow

The P0 evaluator journey must operate as one chain:

```text
diagnostic
→ state estimate
→ recommendation
→ adapted lesson
→ scenario
→ confidence
→ teach-back
→ state transition
→ review schedule
→ dashboard evidence
```

A screen that neither reads nor changes real state must justify its presence. Decorative screens are removed from P0 navigation.

### PSA-05 Learner control

The learner must be able to:

- inspect the model,
- see recommendation evidence,
- choose another route,
- change scaffold level,
- reset a concept,
- disable a personalization signal,
- export or delete profile data.

Overrides must be respected and auditable.

### PSA-06 Domain relevance

P0 content must remain focused on preventive digital-safety learning for Indian citizens. At least three distinct Indian-life contexts must be demonstrated without using real institution impersonation.

### PSA-07 Real functional evaluation

On the deployed environment:

- the exact P0 evaluator journey passes **three consecutive times**,
- test credentials work,
- refresh and reauthentication preserve state,
- previously unseen valid input is processed correctly,
- the model-failure path completes using truthful fallback.

### PSA-08 Outcome metric integrity

Primary product metrics must measure learning, not attention.

Required metrics:

- verified concept-state gain,
- delayed retrieval success,
- transfer success,
- misconception recurrence,
- confidence calibration,
- hint dependence.

Streaks, clicks, and session duration may be diagnostic telemetry but may not be represented as learning success.

## 4.3 Release threshold

All PSA criteria must PASS. Any fabricated causality, disconnected core feature, or inability to demonstrate evolving personalized state is a Critical defect.

---

# 5. High Impact: Code Quality

## 5.1 Intent

Code must be clean, understandable, modular, reliable, and maintainable. The applicable ISO/IEC 25010 qualities include functional suitability, reliability, performance efficiency, interaction capability, security, compatibility, maintainability, flexibility, and safety.

## 5.2 Mandatory criteria

### CQ-01 Build discipline

The following must pass from a clean checkout:

- dependency installation using the locked package manager,
- production build,
- strict type checking,
- linting,
- formatting check,
- unit tests,
- contract tests,
- integration tests,
- P0 end-to-end tests.

No undocumented local-only steps are allowed.

### CQ-02 Strict typing and schema boundaries

- TypeScript strict mode enabled.
- No implicit `any`.
- Explicit `any` prohibited in new application code except a documented external-adapter boundary.
- Every network, database, environment, upload, event, and model-output boundary uses runtime validation.
- Validation failure returns a consistent error envelope and does not partially update learner state.

### CQ-03 Architectural separation

Maintain explicit modules for:

- identity and authorization,
- learner profiles,
- curriculum graph,
- deterministic learner state,
- adaptation and routing,
- lesson content,
- LLM gateway,
- assessment,
- review scheduling,
- analytics,
- evidence and observability.

The LLM gateway must not own authorization, mastery, scheduling, or persistence policy.

### CQ-04 Sonar-style new-code quality gate

For new or changed code:

- reliability rating: **A**,
- security rating: **A**,
- maintainability rating: **A**,
- reviewed security hotspots: **100%**,
- line coverage: **>= 80%**,
- duplicated lines: **<= 3%**.

Equivalent tooling is acceptable when it produces the same evidence.

### CQ-05 Critical-domain coverage

For these deterministic modules, branch coverage must be **100%**:

- authorization policy,
- profile isolation,
- mastery update,
- misconception scoring,
- review scheduling,
- route eligibility,
- external-action confirmation,
- model-output acceptance/rejection.

Generated boilerplate and framework glue may be excluded only through documented configuration.

### CQ-06 Complexity control

- Prefer small pure functions for scoring and state transitions.
- A function with cyclomatic complexity above **10** requires refactoring or a written justification and focused tests.
- Circular dependencies are prohibited.
- Public module interfaces must be documented.
- A duplicate implementation of a learning rule is prohibited; rules have one source of truth.

The complexity threshold is a project engineering convention used to enforce maintainability, not an organizer-provided rule.

### CQ-07 Error handling

- No swallowed exceptions.
- No raw stack traces or provider errors returned to users.
- Errors include a trace identifier.
- Partial failures cannot corrupt learner state.
- Idempotency is required for retryable state-changing operations.
- Model timeout, refusal, invalid schema, and safety rejection are distinct error states.

### CQ-08 Dependency hygiene

- Lockfile committed.
- No unused production dependency.
- Dependency license and vulnerability inventory generated.
- Software Bill of Materials generated for release.
- Critical and High known exploitable dependency findings: **0**.
- Dependency upgrades must not silently change public behaviour.

### CQ-09 Repository hygiene

- No secrets, generated credentials, databases, build output, or personal uploads committed.
- No unresolved merge markers.
- No P0 `TODO`, `FIXME`, placeholder handler, empty catch, or disabled test.
- Environment variables documented in `.env.example` without values.
- Setup and release commands are reproducible.

### CQ-10 Review independence

Every P0 module must receive an independent code review by an agent that did not implement it. Sol must inspect the diff and test evidence before merge.

## 5.3 Release threshold

All CQ criteria must PASS. Reliability, security, maintainability, contract, or build failures are release blockers.

---

# 6. Medium Impact: Security

## 6.1 Intent

Protect learner data, prevent cross-profile access, constrain LLM behaviour, and follow secure software development practices. Target applicable OWASP ASVS 5.0.0 Level 2 controls.

## 6.2 Mandatory criteria

### SEC-01 Threat model

Maintain a threat model covering:

- assets,
- trust boundaries,
- entry points,
- roles,
- abuse cases,
- LLM prompt injection,
- indirect prompt injection,
- cross-profile and cross-tenant access,
- upload abuse,
- sensitive-data leakage,
- model-output misuse,
- cloud credential compromise.

Every High or Critical threat requires a mitigation and verification test.

### SEC-02 Authentication and session security

- Server-validated authentication.
- Secure, HttpOnly, SameSite cookies when cookies are used.
- Session expiry and revocation.
- No authentication token in URL or logs.
- Test account credentials are dummy credentials and isolated from production accounts.
- Rate limiting on authentication and sensitive endpoints.

### SEC-03 Authorization and object-level isolation

- Deny by default.
- Enforce authorization server-side on every object access.
- Verify tenant and profile ownership for every identifier.
- Direct object reference manipulation tests must fail safely.
- Household administrators cannot access another household.
- One profile cannot read another profile's private learning events without an explicitly authorized household aggregate endpoint.

### SEC-04 Secret management and IAM

- Secrets stored in Secret Manager or secure runtime injection.
- No client-side model key.
- No service-account key file committed or baked into an image.
- Dedicated service accounts by workload.
- No Owner or Editor role for application runtime.
- IAM permissions documented and reviewed for least privilege.

### SEC-05 Input, output, and upload validation

- Runtime schema validation for every API input.
- Context-appropriate output encoding.
- Parameterized database operations.
- File type, signature, size, count, and decompression limits.
- Temporary uploads deleted by policy.
- Submitted URLs are treated as text and never fetched in P0.
- Uploaded or pasted secrets are blocked or redacted before model use and logging.

### SEC-06 LLM integration security

Align with OWASP LLMSVS 2.0 applicable requirements.

Required controls:

- system policy isolated from learner content,
- learner content treated as untrusted data,
- strict structured output,
- allowlisted tools only,
- no model-created authorization decisions,
- no model-created database query execution,
- no arbitrary URL fetch,
- output safety validation,
- bounded tokens and timeout,
- model and prompt-template version logging,
- prompt-injection regression corpus,
- fallback on refusal or invalid output,
- no hidden reasoning exposure.

### SEC-07 Privacy and data minimization

- Collect only learning signals required for declared adaptation.
- Versioned consent.
- Per-signal opt-out.
- Export and deletion.
- Uploaded private content is not retained by default.
- Analytics use pseudonymous identifiers.
- PII prohibited from logs and BigQuery events.
- No sensitive-attribute inference.

### SEC-08 Browser and API hardening

- TLS only.
- Security headers configured, including a restrictive Content Security Policy.
- CORS allowlist, not wildcard with credentials.
- CSRF protection where applicable.
- Request-size and resource-consumption limits.
- API rate limits and bounded pagination.
- Secure cache directives for private data.

### SEC-09 Supply-chain security

- Secret scanning.
- Static application security testing.
- Dependency vulnerability scanning.
- Container image scanning.
- Lockfile integrity.
- SBOM generated.
- CI actions pinned to immutable versions or commit SHAs when supported.

### SEC-10 Security defect threshold

At release:

- unresolved Critical findings: **0**,
- unresolved High findings: **0**,
- exploitable Medium findings on the P0 path: **0**,
- unreviewed security hotspots: **0**.

## 6.3 Required adversarial tests

- cross-profile object ID substitution,
- cross-household object ID substitution,
- prompt injection in teach-back text,
- prompt injection in a fictional message,
- active URL in model output,
- real institution name in model output,
- secret-like text submission,
- oversized upload,
- unsupported file signature,
- repeated AI requests for resource exhaustion,
- invalid state-transition payload,
- replay of an idempotent request.

## 6.4 Release threshold

All SEC criteria must PASS. Any fabricated AI provenance, cross-profile leak, secret exposure, or unauthorized action is Critical.

---

# 7. Medium Impact: Efficiency

## 7.1 Intent

Use time, memory, network, AI tokens, and cloud resources efficiently while preserving correctness. Performance requirements must be defined, measured, monitored, and iterated rather than guessed after implementation.

## 7.2 Mandatory criteria

### EFF-01 Core Web Vitals

At the 75th percentile for the evaluator environment:

- Largest Contentful Paint: **<= 2.5 seconds**,
- Interaction to Next Paint: **<= 200 milliseconds**,
- Cumulative Layout Shift: **<= 0.1**.

Measure mobile and desktop separately when field data is available. Use laboratory evidence before submission and runtime measurement in the deployed app.

### EFF-02 Project API service levels

Project-defined release SLOs:

- cached/read-only non-AI API p95: **<= 300 ms**,
- state-changing non-AI API p95: **<= 500 ms**,
- AI-assisted endpoint p95: **<= 8 s**,
- AI timeout: **<= 12 s**,
- fallback completion after model failure: **<= 15 s**,
- server error rate under release load: **< 1%**.

These are internal engineering thresholds, not organizer-provided values.

### EFF-03 Bounded AI usage

- One model call must not be used where deterministic code suffices.
- Prompt context is allowlisted and bounded.
- Maximum input and output tokens configured per feature.
- Identical approved content transformations may be cached by safe cache key.
- Model retry count: maximum **1** for transient failure.
- Retries must be idempotent.
- Smaller or cheaper configured models may handle bounded classification; richer generation is reserved for user-visible explanations when needed.
- Cost and latency recorded per feature.

### EFF-04 Data access efficiency

- No unbounded collection scan on the P0 path.
- Required Firestore indexes committed and validated.
- Pagination for lists.
- No N+1 query pattern.
- BigQuery ingestion asynchronous from the learner response path.
- Aggregates precomputed or queried within a documented budget.
- Analytics failure must not block learning-state persistence.

### EFF-05 Frontend budget

- Route-level lazy loading for non-core features.
- Images optimized and sized.
- No unnecessary animation or autoplay media.
- Production initial JavaScript transfer target: **<= 750 KiB compressed** unless a measured, documented exception is approved.
- Core journey remains usable on a throttled mobile network profile.

### EFF-06 Load and stability test

Minimum release test:

- **50 concurrent virtual users**,
- **5 minutes** steady state,
- mixed login, profile read, diagnostic, state update, and dashboard traffic,
- error rate **< 1%**,
- no unbounded memory growth,
- no duplicate state transition under retries.

AI provider calls may be rate-isolated in a separate controlled scenario, but the real integration must still be tested.

### EFF-07 Observability

Record and dashboard:

- request latency,
- error rate,
- model latency,
- model failure and rejection rate,
- fallback rate,
- Firestore operation count,
- BigQuery ingestion lag,
- CPU and memory,
- token usage,
- estimated feature cost.

## 7.3 Release threshold

Core Web Vitals must meet good thresholds in the tested evaluator profile. All project SLOs must PASS or have a documented exception approved by Sol with evidence that the evaluator journey remains reliable.

---

# 8. Low Impact but Decisive: Testing

## 8.1 Intent

Testing must prove behaviour, maintainability, and evaluator reliability. Coverage percentage alone is insufficient.

## 8.2 Mandatory criteria

### TST-01 Test layers

Required suites:

- unit,
- property or table-driven tests for formulas,
- contract,
- integration,
- end-to-end,
- security,
- accessibility,
- performance,
- deployment smoke.

### TST-02 Deterministic engine tests

Test boundaries and combinations for:

- mastery update,
- confidence adjustment,
- misconception severity,
- forgetting pressure,
- prerequisite eligibility,
- route selection,
- scaffold movement,
- review intervals,
- learner override,
- state idempotency.

Use fixed clocks and deterministic random seeds.

### TST-03 AI contract tests

For every AI feature, test:

- valid structured output,
- malformed JSON,
- missing required field,
- extra prohibited field,
- invariant violation,
- active URL,
- real-person or institution reference,
- prompt injection,
- timeout,
- refusal,
- safety rejection,
- fallback.

### TST-04 End-to-end evaluator test

Automate the full P0 evaluator journey against the deployed or production-equivalent environment.

Required results:

- three consecutive passes,
- no retry caused by flakiness,
- screenshots or trace retained,
- actual AI call evidence retained,
- state persistence verified after reauthentication.

### TST-05 Novel-input test

At least one scenario, learner explanation, and route decision must use valid input not present in seed fixtures. This detects hardcoded or memorized demo behaviour.

### TST-06 Mutation testing

For the deterministic adaptive engine:

- mutation score target: **>= 70%**,
- surviving mutants in authorization, state transition, or scoring boundaries must be fixed or explicitly justified.

This is a project quality threshold, not an organizer-provided requirement.

### TST-07 Flake policy

- Quarantined P0 tests: prohibited.
- Disabled P0 tests: prohibited.
- A flaky P0 test is a failing gate until the root cause is fixed.
- Network-dependent tests use bounded retries only around the external dependency, not around assertions.

### TST-08 Defect regression

Every Critical, High, or Medium functional defect requires a regression test before closure when technically practical.

## 8.3 Release threshold

All P0 suites must PASS. Coverage and mutation thresholds must be met. The deployed evaluator journey must pass three times consecutively.

---

# 9. Low Impact but Decisive: Accessibility

## 9.1 Intent

The application must be usable across abilities, devices, languages, literacy levels, and network conditions. Target WCAG 2.2 Level AA for the complete P0 journey.

## 9.2 Mandatory criteria

### A11Y-01 WCAG conformance target

- P0 routes conform to WCAG 2.2 Level AA.
- Any nonconformance is a release blocker unless genuinely not applicable.
- Automated testing supplements but does not replace manual testing.

### A11Y-02 Keyboard and focus

- Every P0 function works with keyboard only.
- Logical focus order.
- Visible focus indicator.
- No keyboard trap.
- Focus moves to meaningful content after route changes, dialogs, and errors.
- Focus is not obscured by sticky content.

### A11Y-03 Semantics and announcements

- Semantic landmarks and headings.
- Correct labels, names, roles, and states.
- Validation errors associated with fields.
- Dynamic learner feedback announced through appropriate live regions.
- Charts and knowledge maps include equivalent text summaries and data tables.

### A11Y-04 Visual access

- Text and interface contrast meet AA.
- Information is not conveyed by colour alone.
- Works at **200% zoom**.
- Reflows without loss of information at **320 CSS pixels** width where applicable.
- Target sizes satisfy WCAG 2.2 minimum requirements.
- Reduced-motion preference respected.

### A11Y-05 Audio and voice

- Captions or transcripts for prerecorded audio.
- Voice input is optional, never required.
- Equivalent text path exists.
- Processing and retention consent is explicit.

### A11Y-06 Cognitive and low-literacy support

- Plain-language mode.
- Short-session route.
- Consistent help placement.
- No forced countdown on learning tasks.
- Error recovery preserves entered data where safe.
- Avoid shame, blame, and unexplained scores.

### A11Y-07 Language quality

- Language switch is accessible and persists per profile.
- Hindi and English interface text is human-reviewed for P0.
- Mixed-language content has correct language metadata where practical.
- No clipped, overlapping, or untranslated P0 control text.

### A11Y-08 Test evidence

Required:

- automated accessibility scan with **0 Critical and 0 Serious** issues,
- Lighthouse accessibility score target **>= 95** as supplemental evidence,
- keyboard-only manual test,
- screen-reader smoke test on at least one common desktop combination,
- 200% zoom test,
- narrow viewport test,
- reduced-motion test.

## 9.3 Release threshold

All P0 WCAG 2.2 AA criteria must PASS. Critical or Serious automated issues and any keyboard blocker prevent release.

---

# 10. Cross-parameter release scorecard

Sol must generate `orchestration/evidence/release-scorecard.md` using this structure:

| Gate | Status | Evidence location | Blocking defect | Owner |
|---|---|---|---|---|
| PSA-01 | PASS/FAIL | path or trace | defect ID | agent |
| ... | ... | ... | ... | ... |

## 10.1 Final release rule

Release is allowed only when:

- all High-impact gates PASS,
- all Medium-impact gates PASS,
- all Low-impact gates PASS,
- Critical defects = 0,
- High defects = 0,
- evaluator journey passes three consecutive times on the deployed environment,
- Sol independently verifies evidence.

There is no “good enough because the category is Low impact” exception. Humans invented weighted scoring, then predictably tried to ignore the smaller numbers. This file does not permit that manoeuvre.
