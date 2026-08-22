# SurakshaSutra Video Demo Guide

Keep the complete recording under four minutes.

Live app: <https://sutra.dmj.one>

To display the evaluator credentials locally:

```bash
grep '^EVALUATOR_\(EMAIL\|PASSWORD\)=' .env
```

Do not show `.env`, API keys, authentication tokens, or service-account credentials in the recording.

## 0:00–0:20 — Problem

Show the login screen.

Say:

> SurakshaSutra is a learner-owned adaptive digital-safety companion for Indian households. It identifies misconceptions, teaches the next useful concept, verifies learning, and schedules review.

## 0:20–0:40 — Live login

1. Type the evaluator email live.
2. Type the password. It should remain masked.
3. Sign in.
4. Briefly show the three isolated learner profiles.

Say:

> One household supports multiple learners, each with isolated preferences and learning state.

## 0:40–1:05 — Personalisation

1. Select **सविता**.
2. Show Hindi, seven-minute sessions, simple reading, accessibility controls, and consent controls.
3. Briefly change one setting and save it.

Say:

> The learner controls language, complexity, session duration, accessibility, consent, and which evidence may personalise future sessions.

## 1:05–1:35 — Live diagnostic

1. Select the unsafe answer about approving the outgoing action.
2. Move confidence to approximately **95%**.
3. Click **Record diagnostic evidence**.
4. Show the Deep Route recommendation, its evidence, and scaffold level 2.

Say:

> This deliberately creates a high-confidence misconception. Deterministic code, not the language model, updates mastery, uncertainty, and misconception severity.

## 1:35–2:10 — GenAI in action

1. Choose **Deep Route**.
2. Choose support level **2**.
3. Click **Continue with Deep Route**.
4. Pause on the generated Hindi explanation.
5. Open **live evidence** or the **System Evidence Drawer**.

Point out:

- Vertex AI as the provider.
- `gemini-3.5-flash-lite` as the model.
- The real request ID and latency.
- Schema and safety validation.
- That fallback was not used.
- The source concepts and invariants.

Say:

> Vertex AI adapts approved instructional content to Savita's selected language, route, and scaffold level. It cannot directly set learner mastery.

## 2:10–2:50 — Simulator and transfer

1. Show the `TRAINING SIMULATION` label.
2. Select the safe independent-verification response.
3. Submit it.
4. Complete the visually different pension transfer scenario.

Say:

> The simulator contains no active links, real institutions, credentials, or operational scam instructions. The transfer scenario tests the same safety invariant in a different context.

## 2:50–3:25 — Teach-back and Memory Radar

Type this explanation live:

> Receiving money never requires me to approve an outgoing payment. I should pause and verify independently instead of trusting urgency or familiar colours.

Submit it, then show:

- Correct and partial claims.
- Missing connections or misconceptions.
- The targeted follow-up question.
- The Living Knowledge Twin.
- The estimated-recall label.
- The scheduled review.
- Persisted analytics.

Say:

> Teach-back is converted into structured claims against stored rubrics. Deterministic code then updates the Knowledge Twin and schedules retrieval practice.

## 3:25–3:50 — Edge case and truthful fallback

1. Click **Test fallback path**.
2. Run the explanation again.
3. Open the evidence drawer.

Say:

> The evaluator-only failure control proves the edge case. The interface explicitly labels curated fallback and records that a model call was attempted but failed.

## 3:50–3:58 — Finish

Say:

> SurakshaSutra connects observation, adaptation, teaching, assessment, explanation, state updates, and scheduled review in one persistent learner-controlled loop.

## Recording checklist

- Keep the browser zoom around 80–90% so evidence and state changes remain visible.
- Keep the cursor visible and pause briefly after important results.
- Enter the diagnostic and teach-back content live.
- Show both the successful live model result and the truthful fallback path.
- Keep the final video under four minutes.
- Upload it to Google Drive with **Anyone with the link** access or to YouTube as **Unlisted**.
- Verify the final video link in an incognito window before submitting.
