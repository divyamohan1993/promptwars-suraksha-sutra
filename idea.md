# SurakshaSutra Product and Intelligence Specification

## 1. Product identity

```yaml
product_name: SurakshaSutra
category: Adaptive Learning Intelligence System
social_cause: Digital safety and digital resilience
primary_country: India
primary_users: Indian citizens and households
primary_deployment: Google Cloud
primary_orchestrator: GPT-5.6 Sol
subagent_model: GPT-5.6 Luna Max
```

## 2. Product thesis

SurakshaSutra is a learner-owned adaptive digital-safety companion. It maintains a separate, evolving knowledge model for each learner and uses that model to decide:

1. what the learner should understand next,
2. which misconception must be corrected first,
3. how much guidance the learner needs,
4. which context and language should be used,
5. whether understanding transfers to a new situation,
6. when the concept should be retrieved again.

The product is successful only when later learner behaviour demonstrates improved understanding. Completion, clicks, streaks, and time-on-platform are not valid substitutes for learning.

## 3. Challenge alignment

The product directly implements the challenge through:

| Challenge need | Required SurakshaSutra mechanism |
|---|---|
| Different prior knowledge | Scenario-based adaptive diagnostic |
| Different pace | Learner-controlled session duration and route |
| Different learning gaps | Per-concept Knowledge Twin and prerequisite graph |
| Different goals | Personal Learning Constitution |
| Different ways of understanding | Outcome-measured modality and scaffold adaptation |
| Evolving knowledge state | Deterministic state update after every assessed interaction |
| Personalized experience | Route, language, context, difficulty, hints, and review timing |
| Explanations | Approved concept invariants plus adapted presentation |
| Interactive learning | Safe fictional scenario simulator |
| Assessment | Recall, application, transfer, confidence, and teach-back |
| Feedback | Misconception-specific contrastive feedback |
| Knowledge tracking | Inspectable Knowledge Twin |
| Adaptive content | Schema-constrained generation and curated fallback |
| Whole-application functionality | One connected evaluator journey with persistent state |

## 4. Domain boundary

### 4.1 Allowed educational scope

- digital identity and authentication safety,
- OTP, PIN, password, and account-recovery concepts,
- payment-direction understanding,
- QR and collect-request safety,
- independent identity verification,
- urgency, fear, authority, and reward manipulation awareness,
- app permissions and remote-access risk,
- non-political source, date, evidence, and context verification,
- evidence preservation and official-channel awareness,
- household digital-safety habits.

### 4.2 Prohibited scope

The system must not:

- teach offensive hacking,
- generate working phishing content,
- generate malware or credential-harvesting pages,
- provide active malicious links,
- impersonate real institutions or people,
- imitate relatives or public figures,
- request or store passwords, OTPs, PINs, or full payment credentials,
- initiate financial transactions,
- access private messages without deliberate user submission,
- automatically submit police, legal, or bank reports,
- produce political persuasion,
- diagnose psychology or health,
- infer caste, religion, politics, health, or financial status,
- describe a learner as unintelligent, careless, or gullible.

## 5. Product principles

### 5.1 Learner sovereignty

The system may recommend, but the learner can inspect, modify, or reject every adaptation.

Required controls:

- `Why am I seeing this?`
- `Show your evidence`
- `I already know this`
- `Test me instead`
- `Explain from the beginning`
- `Change guidance level`
- `Reset this concept`
- `Turn personalization off`
- `Export my profile`
- `Delete my history`

### 5.2 Observable evidence over personality labels

Adapt using measurable outcomes:

- correctness,
- confidence,
- response time,
- attempts,
- hints,
- teach-back claims,
- delayed retrieval,
- cross-context transfer.

Do not permanently classify learners as visual, auditory, or kinaesthetic. Store presentation preferences separately from demonstrated effectiveness.

### 5.3 Concept invariants over generated eloquence

Every concept has non-negotiable factual invariants. Generated explanations, analogies, translations, and scenarios must preserve them.

### 5.4 Deterministic learning state

The LLM generates or interprets content. Deterministic application code controls learner-state transitions, eligibility, scheduling, permissions, and persistence.

### 5.5 Verified learning gain

The optimization target is:

```text
verified learning gain per minute
```

Do not optimize for:

- session length,
- notifications opened,
- clicks,
- artificial streak preservation,
- number of generated messages.

## 6. Target profiles

### 6.1 Household profiles

- senior citizen,
- school learner,
- college learner,
- working professional,
- homemaker,
- small merchant,
- first-time digital-payment user,
- learner requiring accessibility support.

### 6.2 Required demo household

```yaml
household: Bharat Digital Family
profiles:
  - name: Savita
    age_band: 60+
    language: hi
    interface: voice_first
    reading_complexity: simple
    session_minutes: 5
    contexts: [pension, messaging, upi]
    initial_learner_state: unassessed
    demo_diagnostic_focus: payment_direction

  - name: Arjun
    age_band: 18-24
    language: hinglish
    interface: fast_interactive
    reading_complexity: standard
    session_minutes: 8
    contexts: [internship, gaming, online_shopping]
    initial_learner_state: unassessed
    demo_diagnostic_focus: urgency_based_job_claims

  - name: Ramesh
    age_band: 35-55
    language: hi_en
    interface: transaction_focused
    reading_complexity: standard
    session_minutes: 7
    contexts: [small_business, qr_payments, customer_support]
    initial_learner_state: unassessed
    demo_diagnostic_focus: remote_access_requests
```

Seed data initializes authentication, profile preferences, and safe curriculum content only. Learner concept state starts unassessed. All displayed diagnostics, adaptations, state transitions, AI outputs, and analytics must be computed through production logic during the evaluator journey.

## 7. Personal Learning Constitution

### 7.1 Schema

```json
{
  "goal": "Recognize and safely respond to common digital manipulation",
  "deadline": null,
  "sessionMinutes": 7,
  "preferredLanguages": ["hi", "en"],
  "readingComplexity": "simple|standard|advanced",
  "explanationDepth": "brief|conceptual|deep",
  "challengePreference": "gentle|moderate|high",
  "relevantContexts": ["upi", "messaging", "jobs"],
  "allowVoiceProcessing": false,
  "allowCrossSessionPersonalization": true,
  "allowReminderNotifications": false,
  "personalizationSignals": {
    "correctness": true,
    "confidence": true,
    "responseTime": true,
    "hintUse": true,
    "teachBack": true,
    "transfer": true
  },
  "accessibility": {
    "keyboardOnly": false,
    "reducedMotion": true,
    "captions": true,
    "textSize": "large",
    "highContrast": false,
    "screenReaderOptimized": false
  }
}
```

### 7.2 Behaviour

- Store versioned consent.
- Explain each signal before collection.
- Allow individual signals to be disabled.
- Recompute recommendations when the learner changes the constitution.
- Do not silently restore a disabled signal.

## 8. Curriculum knowledge graph

### 8.1 Initial concept domains

```text
Trust and Verification
├── pause_before_action
├── independent_verification
├── appearance_is_not_authenticity
└── manipulation_patterns

Digital Identity
├── password_secrecy
├── otp_secrecy
├── pin_authorization
├── multi_factor_authentication
└── account_recovery

Payment Safety
├── money_in_vs_money_out
├── qr_direction
├── collect_request
├── payment_confirmation
└── remote_access_payment_risk

Device and Application Safety
├── app_permissions
├── remote_access_apps
├── unknown_downloads
└── software_updates

Information Verification
├── source_verification
├── date_and_context
├── evidence_quality
└── independent_confirmation

Incident Response
├── stop_interaction
├── preserve_evidence
├── contact_official_channel
└── report_without_victim_blame
```

### 8.2 Edge types

- `prerequisite_of`
- `related_to`
- `contrasts_with`
- `transfers_to`
- `misconception_of`
- `remediated_by`
- `assessed_by`

### 8.3 Concept schema

```json
{
  "conceptId": "money_in_vs_money_out",
  "name": "Receiving money versus authorizing payment",
  "learningObjective": "Distinguish an incoming transfer from an action that authorizes money to leave an account.",
  "invariants": [
    "A secret authorization code is used to authorize an action, not to prove entitlement to receive money.",
    "A request to authorize an outgoing action must be independently verified.",
    "Interface appearance does not prove the identity of the requester."
  ],
  "prerequisites": ["pin_authorization", "independent_verification"],
  "misconceptionIds": ["pin_needed_to_receive_money"],
  "contexts": ["upi", "qr", "collect_request", "support_call"],
  "riskWeight": 0.95,
  "reviewImportance": 0.95,
  "rubricId": "rubric_money_direction_v1",
  "safetyClassification": "preventive_education"
}
```

## 9. Living Knowledge Twin

### 9.1 Per-concept state

```json
{
  "profileId": "profile-savita",
  "conceptId": "money_in_vs_money_out",
  "mastery": 0.32,
  "uncertainty": 0.41,
  "attempts": 3,
  "correctAttempts": 1,
  "averageConfidence": 0.83,
  "averageResponseTimeMs": 11200,
  "hintsUsed": 1,
  "currentScaffoldLevel": 2,
  "transferSuccesses": 0,
  "transferFailures": 1,
  "misconceptionSeverity": 0.88,
  "memoryStabilityDays": 1.5,
  "lastPractisedAt": "2026-08-22T06:30:00Z",
  "nextReviewAt": "2026-08-23T06:30:00Z",
  "evidenceEventIds": ["event-101", "event-109"]
}
```

### 9.2 State labels

```text
0.00-0.24  Unknown
0.25-0.49  Developing
0.50-0.69  Fragile
0.70-0.84  Functional
0.85-1.00  Strong
```

These are internal learning-state labels, not judgements about the person.

## 10. Evidence and adaptation model

### 10.1 Evidence score

Use configurable deterministic weights.

```text
correctness = 1.0 if correct else 0.0

hint_penalty = min(0.30, hints_used * 0.10)

confidence_adjustment =
  +0.10  if correct and confidence >= 0.80
  -0.05  if correct and confidence < 0.40
  -0.20  if incorrect and confidence >= 0.80
   0.00  otherwise

transfer_adjustment =
  +0.15  if unfamiliar_context and correct
  -0.10  if unfamiliar_context and incorrect
   0.00  otherwise

teach_back_adjustment =
  +0.10  if complete
   0.00  if partial
  -0.15  if dangerous_misconception

evidence = clamp(
  correctness
  - hint_penalty
  + confidence_adjustment
  + transfer_adjustment
  + teach_back_adjustment,
  0,
  1
)

new_mastery = clamp(
  old_mastery * 0.65
  + evidence * 0.35,
  0,
  1
)
```

Every state update must store:

- formula version,
- input event IDs,
- previous value,
- new value,
- human-readable reason.

### 10.2 Confidence interpretation

| Result | Interpretation | Adaptation |
|---|---|---|
| Correct + high confidence | likely stable understanding | issue transfer task |
| Correct + low confidence | fragile knowledge | confirm reasoning and retrieve later |
| Incorrect + high confidence | strong misconception | contrastive explanation and scaffold |
| Incorrect + low confidence | ordinary gap | worked example and guided practice |

### 10.3 Misconception creation

Create or increase a misconception when:

- the same wrong reasoning appears twice,
- an incorrect answer has confidence `>= 0.80`,
- teach-back expresses an unsafe rule,
- direct recall succeeds but transfer repeatedly fails.

```text
severity =
  0.40 * recurrence_normalized
+ 0.35 * confidence
+ 0.25 * concept_risk
```

### 10.4 Forgetting model

```text
retention = exp(-elapsed_days / stability_days)
forgetting_pressure = 1 - retention
```

Increase stability after successful delayed retrieval. Decrease stability after failed delayed retrieval.

### 10.5 Next-activity priority

```text
priority =
  0.30 * knowledge_gap
+ 0.25 * misconception_severity
+ 0.20 * forgetting_pressure
+ 0.15 * learner_relevance
+ 0.10 * graph_importance

knowledge_gap = 1 - mastery
```

Only select concepts whose prerequisites meet the configured eligibility threshold, unless the selected activity explicitly repairs the prerequisite.

### 10.6 Explainability payload

```json
{
  "recommendedActivity": "contrastive_payment_direction_simulation",
  "reason": "The learner answered incorrectly with 90% confidence and failed one transfer scenario.",
  "evidence": [
    "event-101: incorrect, confidence 0.90",
    "event-109: transfer failed"
  ],
  "targetConcepts": ["money_in_vs_money_out"],
  "selectedScaffoldLevel": 2,
  "alternatives": ["quick_retrieval", "deep_explanation", "low_energy_example"]
}
```

## 11. Adaptive Scaffold Dial

### 11.1 Levels

| Level | Learner experience |
|---|---|
| 1. Observe | Complete worked example |
| 2. Explain | Explain why each step or decision exists |
| 3. Complete | Fill selected missing decisions |
| 4. Solve | Decide independently with optional hints |
| 5. Transfer | Apply the invariant in a different context |

### 11.2 Selection rules

```text
low mastery + high misconception severity
→ Level 1 or 2

correct + low confidence
→ Level 2 then Level 5

repeated hint dependence
→ move down one level

fast correct answers in at least two contexts
→ Level 5

learner override
→ respect override, record outcome, never punish the learner
```

## 12. Safe scenario system

### 12.1 Scenario schema

```json
{
  "scenarioId": "scenario-payment-001",
  "trainingLabel": "TRAINING SIMULATION",
  "title": "Payment Direction Decision",
  "conceptIds": ["money_in_vs_money_out", "independent_verification"],
  "context": "small_merchant",
  "channel": "fictional_chat",
  "manipulationPatterns": ["urgency", "claimed_authority"],
  "unsafeRequestCategory": "authorize_outgoing_action",
  "prompt": "A fictional support representative asks the learner to approve an action immediately.",
  "choices": [
    {"id": "a", "text": "Approve immediately", "classification": "unsafe"},
    {"id": "b", "text": "Pause and verify through an independent official channel", "classification": "safe"},
    {"id": "c", "text": "Share an authentication secret", "classification": "unsafe"}
  ],
  "safestChoiceId": "b",
  "feedbackRubricId": "rubric-independent-verification-v1",
  "transferScenarioIds": ["scenario-job-014"],
  "constraints": {
    "activeLinks": false,
    "realOrganizations": false,
    "realPhoneNumbers": false,
    "realCredentials": false,
    "operationalFraudInstructions": false
  }
}
```

### 12.2 Generation contract

The model may vary language, names, setting, and reading complexity. It must not change:

- concept IDs,
- invariants,
- safest action,
- safety constraints,
- assessment rubric.

Reject any generated output that contains:

- a URL,
- a realistic credential,
- a real institution or public figure,
- a request for a secret,
- operational attack steps,
- fields outside the schema,
- missing invariants.

### 12.3 Fallback

Every P0 concept must have at least one curated English and Hindi scenario. If model generation fails, use curated content and set:

```json
{
  "generationMode": "curated_fallback",
  "modelCallAttempted": true,
  "modelCallSucceeded": false,
  "fallbackReason": "timeout|refusal|schema_invalid|safety_rejection"
}
```

Never label fallback content as generated.

## 13. Teach-Back Misconception Debugger

### 13.1 Input modes

- text,
- voice when consented,
- selected diagram labels,
- step-by-step explanation.

### 13.2 Output schema

```json
{
  "correctClaims": [
    {"claim": "A secret code authorizes an action.", "invariantId": "inv-01"}
  ],
  "partialClaims": [
    {"claim": "The requester should be checked.", "missing": "independent channel"}
  ],
  "misconceptions": [
    {
      "claim": "A PIN may be required to receive money.",
      "misconceptionId": "pin_needed_to_receive_money",
      "severity": "high"
    }
  ],
  "missingLinks": [
    "Why independent verification must use a channel not supplied by the requester"
  ],
  "targetedQuestion": "Which action proves that you are authorizing money to leave rather than receiving it?",
  "rubricVersion": "rubric-money-direction-v1"
}
```

### 13.3 Feedback form

```text
Solid:
<one evidenced correct concept>

Shaky:
<one partial or ambiguous concept>

Unsafe misconception:
<only when detected; explain the corrected invariant without blame>

Missing connection:
<one concept link>

One question:
<one targeted retrieval or transfer question>
```

## 14. Memory Radar

### 14.1 Baseline intervals

```text
1 day → 3 days → 7 days → 14 days → 30 days → 60 days
```

Modify using:

- mastery,
- confidence calibration,
- delayed retrieval result,
- transfer performance,
- hint dependence,
- misconception recurrence,
- learner deadline.

### 14.2 Future Memory estimate

Display only if at least two historical retrieval observations exist.

Required label:

```text
Estimated recall, not a guarantee
```

Required evidence:

- model version,
- stability estimate,
- elapsed time,
- number of observations,
- expected review schedule.

Do not fabricate a percentage for a new learner with no historical evidence.

## 15. Multi-profile isolation

Every learner profile must isolate:

- constitution,
- concept state,
- misconceptions,
- activity history,
- model inputs,
- review queue,
- analytics,
- uploads,
- exports,
- deletions.

Authorization must enforce ownership on every object-level API operation. Profile isolation must be tested with direct object identifier manipulation, not only hidden UI controls.

## 16. Analytics model

### 16.1 Required events

- `account_created`
- `household_created`
- `profile_created`
- `profile_selected`
- `constitution_updated`
- `diagnostic_started`
- `diagnostic_answered`
- `diagnostic_completed`
- `activity_recommended`
- `route_overridden`
- `scaffold_changed`
- `lesson_started`
- `hint_requested`
- `scenario_answered`
- `confidence_submitted`
- `teachback_submitted`
- `teachback_evaluated`
- `transfer_attempted`
- `transfer_succeeded`
- `transfer_failed`
- `concept_state_updated`
- `misconception_created`
- `misconception_updated`
- `review_scheduled`
- `review_completed`
- `model_call_started`
- `model_call_completed`
- `model_output_rejected`
- `fallback_used`
- `profile_exported`
- `profile_deleted`

### 16.2 Event envelope

```json
{
  "eventId": "uuid",
  "eventName": "scenario_answered",
  "occurredAt": "ISO-8601",
  "tenantId": "pseudonymous-id",
  "profileId": "pseudonymous-id",
  "sessionId": "uuid",
  "conceptIds": ["money_in_vs_money_out"],
  "activityId": "scenario-payment-001",
  "language": "hi",
  "modality": "simulation",
  "correct": false,
  "confidence": 0.9,
  "responseTimeMs": 8200,
  "hintsUsed": 0,
  "schemaVersion": "1.0",
  "metadata": {}
}
```

Never send to analytics:

- passwords,
- OTPs,
- PINs,
- raw authentication tokens,
- full phone numbers,
- full email addresses,
- raw uploaded private content,
- payment credentials,
- exact address,
- hidden prompts.

## 17. System Evidence Drawer

### 17.1 AI evidence

```json
{
  "feature": "adaptive_explanation",
  "provider": "vertex-ai",
  "model": "runtime-model-id",
  "requestId": "provider-request-id-or-trace-id",
  "generatedAt": "ISO-8601",
  "latencyMs": 1830,
  "schemaValid": true,
  "safetyValid": true,
  "generationMode": "live_model",
  "sourceConceptIds": ["money_in_vs_money_out"],
  "promptTemplateVersion": "explanation-v3"
}
```

### 17.2 State-transition evidence

```json
{
  "profileId": "profile-savita",
  "conceptId": "money_in_vs_money_out",
  "stateBefore": {"mastery": 0.32, "misconceptionSeverity": 0.88},
  "stateAfter": {"mastery": 0.48, "misconceptionSeverity": 0.67},
  "formulaVersion": "evidence-v1",
  "reason": "Correct transfer answer with no hints after misconception correction",
  "inputEventIds": ["event-118", "event-119"]
}
```

## 18. P0 user journey

```text
1. Evaluator logs in using supplied test credentials.
2. Evaluator selects Savita.
3. Savita's Hindi, large-control, short-session constitution loads.
4. Diagnostic presents a fictional payment-direction situation.
5. Evaluator selects the unsafe answer with high confidence.
6. Knowledge Twin records a high-priority misconception.
7. Route Engine recommends a Deep Route and explains why.
8. Evaluator accepts or moves the Scaffold Dial.
9. A real model call adapts an approved explanation to simple Hindi.
10. Scenario Simulator presents a fictional guided decision.
11. A transfer scenario changes context while preserving the invariant.
12. Evaluator completes teach-back.
13. Teach-Back Debugger extracts structured claims.
14. Deterministic code updates mastery and misconception state.
15. Memory Radar schedules the next review.
16. Evidence Drawer proves generation and state transition.
17. Evaluator switches to Arjun.
18. The same invariant appears in an internship context with different pace and language.
19. Refresh and reauthentication preserve both isolated profiles.
20. Model failure is simulated; labelled fallback completes the flow.
21. Household dashboard shows metrics computed from stored events.
```

Every step must affect or read real persisted state.

## 19. P0 acceptance criteria

### Functional

- Three profiles can coexist without state leakage.
- Diagnostic answers change learner state through deterministic code.
- High-confidence wrong answers create stronger remediation than low-confidence wrong answers.
- Route and scaffold recommendations differ when evidence differs.
- Learner overrides are respected and recorded.
- A real model call produces a schema-valid adaptation.
- Curated fallback completes the same workflow when the model fails.
- A transfer scenario tests the same invariant in a different context.
- Teach-back produces structured claims mapped to a rubric.
- Review scheduling persists.
- Analytics derive from event records.
- All state survives refresh and reauthentication.

### Truthfulness

- No hardcoded result is displayed as computed output.
- No fallback is displayed as live generation.
- No seeded prior state is presented as newly learned behaviour.
- Evidence Drawer values originate from runtime logs and state records.

### Safety

- No secret can be submitted to an AI prompt or log without redaction.
- No generated scenario contains an active link or real institution.
- Cross-profile API access fails.
- Prompt injection inside learner text cannot alter system policy or tool permissions.

### Accessibility

- Core journey works with keyboard only.
- Dynamic feedback is announced to assistive technology.
- Knowledge map has a complete text alternative.
- Controls work at 200% zoom and narrow viewport.
- Hindi and English text remain readable without clipping.

## 20. P1 features

Implement only after P0 passes every release gate.

### 20.1 Suspicious-message learning mode

- accept pasted text or image,
- warn against submitting secrets,
- redact obvious identifiers,
- never open links,
- express uncertainty,
- identify approved warning-pattern categories,
- map categories to concepts,
- generate a micro-lesson,
- delete by default after the session,
- use a predefined safe sample for evaluator fallback.

### 20.2 Incident checklist

- stop interaction,
- preserve timestamps and screenshots,
- prepare a user-reviewed evidence checklist,
- display configured official channels,
- require confirmation for any external action,
- never submit automatically.

### 20.3 Household drill

Create different role-appropriate versions of one concept for multiple profiles while preserving the same invariants.

## 21. Explicit non-goals

Do not spend hackathon time on:

- avatars,
- multiplayer classrooms,
- facial emotion recognition,
- personality diagnosis,
- VR or AR campuses,
- blockchain,
- cryptocurrency,
- public social feeds,
- unrestricted user-generated courses,
- custom foundation-model training,
- autonomous bank or police interaction,
- twenty decorative dashboards,
- features lacking a complete testable path.

## 22. Google Cloud deployment shape

```text
Browser / PWA
    ↓
HTTPS Load Balancer or secured VM endpoint
    ↓
Google Compute Engine
├── reverse proxy
├── Angular frontend container
├── NestJS API container
└── background worker container
    ↓
Identity Platform / Firebase Auth
Firestore
Vertex AI
BigQuery
Cloud Storage
Cloud Tasks / Scheduler
Secret Manager
Cloud Logging / Monitoring / Trace
```

Use dedicated service accounts by workload. Do not grant project-wide Owner or Editor roles.

## 23. Definition of product success

SurakshaSutra succeeds when an evaluator can observe that two learners receiving the same underlying digital-safety concept are taught differently because their real recorded evidence differs, and when the application can explain and prove every adaptation without exposing private data or pretending that a hardcoded outcome was intelligent.
