import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  aiEvidenceSchema,
  fallbackAiEvidenceSchema,
  lessonSchema,
  teachBackOutputSchema,
  type AiEvidence,
  type Lesson,
  type TeachBackOutput,
} from '@suraksha-sutra/contracts';
import {
  contractInvariants,
  fallbackExplanation,
  makeFallbackTeachBackOutput,
  validateCurriculumSafety,
} from '@surakshasutra/curriculum';

import { getRuntimeEnvironment, type RuntimeEnvironment } from '../config/runtime-environment';
import type { EvidenceRecord } from '../data/data.types';

export interface ExplanationInput {
  readonly profileId: string;
  readonly conceptIds: readonly string[];
  readonly invariantIds: readonly string[];
  readonly rubricId: string;
  readonly language: 'hi' | 'en' | 'hinglish' | 'hi_en';
  readonly route: 'quick' | 'deep' | 'low_energy';
  readonly scaffoldLevel: number;
  readonly traceId: string;
  readonly forceFailure: boolean;
  readonly now: string;
}

export interface ExplanationResult {
  readonly lesson: Lesson;
  readonly evidence: AiEvidence;
  readonly evidenceRecord: EvidenceRecord;
}

export interface TeachBackInput {
  readonly teachBackId: string;
  readonly profileId: string;
  readonly conceptId: string;
  readonly rubricId: string;
  readonly text: string;
  readonly language: 'hi' | 'en' | 'hinglish' | 'hi_en';
  readonly traceId: string;
  readonly forceFailure: boolean;
  readonly now: string;
}

export interface TeachBackResult {
  readonly output: TeachBackOutput;
  readonly evidence: AiEvidence;
  readonly evidenceRecord: EvidenceRecord;
}

const FALLBACK_LABEL =
  'Curated fallback used because the live model was unavailable or its output was rejected.';

@Injectable()
export class VertexGateway {
  private readonly environment: RuntimeEnvironment;

  public constructor(@Inject(ConfigService) config: ConfigService<RuntimeEnvironment>) {
    this.environment = getRuntimeEnvironment(config);
  }

  public async adaptExplanation(input: ExplanationInput): Promise<ExplanationResult> {
    const requestId = input.traceId || randomUUID();
    const started = Date.now();
    const approvedFacts = contractInvariants
      .filter((invariant) => input.invariantIds.includes(invariant.invariantId))
      .map((invariant) => invariant.statement)
      .join(' ');
    const prompt = [
      'You are adapting an approved preventive digital-safety lesson.',
      'Return JSON only with keys explanation and workedExample.',
      'Do not add links, phone numbers, credentials, operational scam instructions, or new facts.',
      `Language: ${input.language}. Route: ${input.route}. Scaffold: ${input.scaffoldLevel}.`,
      `Approved invariant IDs: ${input.invariantIds.join(', ')}. Approved facts: ${approvedFacts}`,
    ].join('\n');
    const model = this.environment.VERTEX_MODEL_ID;
    let failureReason: FailureReason | undefined;
    let modelText: string | undefined;
    if (!input.forceFailure) {
      const result = await this.callVertex(prompt, requestId);
      modelText = result.text;
      failureReason = result.failureReason;
    } else {
      failureReason = 'provider_error';
    }

    if (modelText) {
      const parsed = parseJsonRecord(modelText);
      const explanation = readSafeExplanation(parsed, input.invariantIds);
      if (explanation) {
        const lesson = lessonSchema.parse({
          lessonId: `lesson-${randomUUID()}`,
          profileId: input.profileId,
          conceptIds: [...input.conceptIds],
          language: input.language,
          route: input.route,
          scaffoldLevel: input.scaffoldLevel,
          title: input.language === 'hi' ? 'पैसे की दिशा जाँचें' : 'Check the direction of money',
          objective:
            input.language === 'hi'
              ? 'अनुमति देने से पहले पैसे की दिशा और पहचान की जाँच करें।'
              : 'Check money direction and identity before authorising.',
          explanation: explanation.explanation,
          workedExample: explanation.workedExample,
          sourceInvariantIds: [...input.invariantIds],
          sourceRubricId: input.rubricId,
          generationMode: 'live_model',
          createdAt: input.now,
        });
        const latencyMs = boundedLatency(Date.now() - started);
        const evidence = aiEvidenceSchema.parse({
          feature: 'adaptive_explanation',
          provider: 'vertex-ai',
          model,
          requestId,
          generatedAt: input.now,
          latencyMs,
          generationMode: 'live_model',
          modelCallAttempted: true,
          modelCallSucceeded: true,
          schemaValid: true,
          safetyValid: true,
          sourceConceptIds: [...input.conceptIds],
          promptTemplateVersion: this.environment.PROMPT_TEMPLATE_VERSION,
        });
        return {
          lesson,
          evidence,
          evidenceRecord: {
            evidenceId: randomUUID(),
            feature: 'adaptive_explanation',
            generationMode: 'live_model',
            provider: 'vertex-ai',
            model,
            requestId,
            generatedAt: input.now,
            latencyMs,
            schemaValid: true,
            safetyValid: true,
            sourceConceptIds: [...input.conceptIds],
          },
        };
      }
      failureReason = 'schema_invalid';
    }
    const reason = failureReason ?? 'provider_error';
    return this.fallbackExplanation(input, requestId, started, reason);
  }

  public async extractTeachBack(input: TeachBackInput): Promise<TeachBackResult> {
    const requestId = input.traceId || randomUUID();
    const started = Date.now();
    const approvedFacts = contractInvariants
      .filter((invariant) => invariant.conceptId === input.conceptId)
      .map((invariant) => `${invariant.invariantId}: ${invariant.statement}`)
      .join('\n');
    const prompt = [
      'Evaluate the learner text against approved digital-safety invariants.',
      'Return JSON only matching the requested structured output. Never invent IDs.',
      'Use only the supplied concept, rubric, invariant, and misconception IDs.',
      `profileId=${input.profileId}; teachBackId=${input.teachBackId}; conceptId=${input.conceptId}; rubricId=${input.rubricId}`,
      `Approved facts:\n${approvedFacts}`,
      `Learner text (do not retain it): ${input.text.slice(0, this.environment.VERTEX_MAX_INPUT_CHARS)}`,
    ].join('\n');
    let failureReason: FailureReason | undefined;
    let modelText: string | undefined;
    if (!input.forceFailure) {
      const result = await this.callVertex(prompt, requestId);
      modelText = result.text;
      failureReason = result.failureReason;
    } else {
      failureReason = 'provider_error';
    }
    if (modelText) {
      const parsed = parseJsonRecord(modelText);
      const output = parseTeachBack(parsed, input);
      if (output) {
        const latencyMs = boundedLatency(Date.now() - started);
        const evidence = aiEvidenceSchema.parse({
          feature: 'teach_back_extraction',
          provider: 'vertex-ai',
          model: this.environment.VERTEX_MODEL_ID,
          requestId,
          generatedAt: input.now,
          latencyMs,
          generationMode: 'live_model',
          modelCallAttempted: true,
          modelCallSucceeded: true,
          schemaValid: true,
          safetyValid: true,
          sourceConceptIds: [input.conceptId],
          promptTemplateVersion: this.environment.PROMPT_TEMPLATE_VERSION,
        });
        return {
          output,
          evidence,
          evidenceRecord: {
            evidenceId: output.evidenceId,
            feature: 'teach_back_extraction',
            generationMode: 'live_model',
            provider: 'vertex-ai',
            model: this.environment.VERTEX_MODEL_ID,
            requestId,
            generatedAt: input.now,
            latencyMs,
            schemaValid: true,
            safetyValid: true,
            sourceConceptIds: [input.conceptId],
          },
        };
      }
      failureReason = 'schema_invalid';
    }
    const reason = failureReason ?? 'provider_error';
    return this.fallbackTeachBack(input, requestId, started, reason);
  }

  private fallbackExplanation(
    input: ExplanationInput,
    requestId: string,
    started: number,
    reason: FailureReason,
  ): ExplanationResult {
    const latencyMs = boundedLatency(Date.now() - started);
    const explanation = fallbackExplanation.explanation[input.language];
    const lesson = lessonSchema.parse({
      lessonId: `lesson-${randomUUID()}`,
      profileId: input.profileId,
      conceptIds: [...input.conceptIds],
      language: input.language,
      route: input.route,
      scaffoldLevel: input.scaffoldLevel,
      title: input.language === 'hi' ? 'पैसे की दिशा जाँचें' : 'Check the direction of money',
      objective:
        input.language === 'hi'
          ? 'अनुमति देने से पहले पैसे की दिशा और पहचान की जाँच करें।'
          : 'Check money direction and identity before authorising.',
      explanation: `${FALLBACK_LABEL} ${explanation}`,
      workedExample: input.route === 'deep' ? explanation : undefined,
      sourceInvariantIds: [...input.invariantIds],
      sourceRubricId: input.rubricId,
      generationMode: 'curated_fallback',
      createdAt: input.now,
    });
    const evidence = fallbackAiEvidenceSchema.parse({
      feature: 'adaptive_explanation',
      provider: 'vertex-ai',
      model: this.environment.VERTEX_MODEL_ID,
      requestId,
      generatedAt: input.now,
      latencyMs,
      generationMode: 'curated_fallback',
      modelCallAttempted: true,
      modelCallSucceeded: false,
      failureReason: reason,
      fallbackLabel: FALLBACK_LABEL,
      schemaValid: true,
      safetyValid: true,
      sourceConceptIds: [...input.conceptIds],
      promptTemplateVersion: this.environment.PROMPT_TEMPLATE_VERSION,
    });
    return {
      lesson,
      evidence,
      evidenceRecord: {
        evidenceId: randomUUID(),
        feature: 'adaptive_explanation',
        generationMode: 'curated_fallback',
        provider: 'vertex-ai',
        model: this.environment.VERTEX_MODEL_ID,
        requestId,
        generatedAt: input.now,
        latencyMs,
        schemaValid: true,
        safetyValid: true,
        sourceConceptIds: [...input.conceptIds],
        failureReason: reason,
        fallbackLabel: FALLBACK_LABEL,
      },
    };
  }

  private fallbackTeachBack(
    input: TeachBackInput,
    requestId: string,
    started: number,
    reason: FailureReason,
  ): TeachBackResult {
    const latencyMs = boundedLatency(Date.now() - started);
    const evidenceId = randomUUID();
    const output = teachBackOutputSchema.parse(
      makeFallbackTeachBackOutput({
        teachBackId: input.teachBackId,
        profileId: input.profileId,
        conceptId: input.conceptId,
        evaluatedAt: input.now,
        evidenceId,
      }),
    );
    const evidence = fallbackAiEvidenceSchema.parse({
      feature: 'teach_back_extraction',
      provider: 'vertex-ai',
      model: this.environment.VERTEX_MODEL_ID,
      requestId,
      generatedAt: input.now,
      latencyMs,
      generationMode: 'curated_fallback',
      modelCallAttempted: true,
      modelCallSucceeded: false,
      failureReason: reason,
      fallbackLabel: FALLBACK_LABEL,
      schemaValid: true,
      safetyValid: true,
      sourceConceptIds: [input.conceptId],
      promptTemplateVersion: this.environment.PROMPT_TEMPLATE_VERSION,
    });
    return {
      output,
      evidence,
      evidenceRecord: {
        evidenceId,
        feature: 'teach_back_extraction',
        generationMode: 'curated_fallback',
        provider: 'vertex-ai',
        model: this.environment.VERTEX_MODEL_ID,
        requestId,
        generatedAt: input.now,
        latencyMs,
        schemaValid: true,
        safetyValid: true,
        sourceConceptIds: [input.conceptId],
        failureReason: reason,
        fallbackLabel: FALLBACK_LABEL,
      },
    };
  }

  private async callVertex(
    prompt: string,
    requestId: string,
  ): Promise<{ readonly text?: string; readonly failureReason?: FailureReason }> {
    if (!this.environment.GCP_PROJECT_ID || !this.environment.GCP_RUNTIME_API_KEY) {
      return { failureReason: 'provider_error' };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.environment.VERTEX_TIMEOUT_MS);
    try {
      const host =
        this.environment.VERTEX_LOCATION === 'global'
          ? 'aiplatform.googleapis.com'
          : `${this.environment.VERTEX_LOCATION}-aiplatform.googleapis.com`;
      const endpoint = `https://${host}/v1/projects/${encodeURIComponent(this.environment.GCP_PROJECT_ID)}/locations/${encodeURIComponent(this.environment.VERTEX_LOCATION)}/publishers/google/models/${encodeURIComponent(this.environment.VERTEX_MODEL_ID)}:generateContent`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': this.environment.GCP_RUNTIME_API_KEY,
          'x-client-trace-id': requestId,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt.slice(0, this.environment.VERTEX_MAX_INPUT_CHARS + 4_000) }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: this.environment.VERTEX_MAX_OUTPUT_TOKENS,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        return { failureReason: response.status === 429 ? 'quota_rate_limit' : 'provider_error' };
      }
      const body: unknown = await response.json();
      const text = readVertexText(body);
      return text ? { text } : { failureReason: 'schema_invalid' };
    } catch (error: unknown) {
      return {
        failureReason:
          error instanceof DOMException && error.name === 'AbortError'
            ? 'timeout'
            : 'provider_error',
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

type FailureReason =
  | 'timeout'
  | 'refusal'
  | 'provider_error'
  | 'schema_invalid'
  | 'safety_rejection'
  | 'quota_rate_limit';

function readVertexText(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidates = (value as { readonly candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || !candidates[0] || typeof candidates[0] !== 'object')
    return undefined;
  const content = (candidates[0] as { readonly content?: unknown }).content;
  if (!content || typeof content !== 'object') return undefined;
  const parts = (content as { readonly parts?: unknown }).parts;
  if (!Array.isArray(parts)) return undefined;
  const part = parts.find(
    (candidate) =>
      candidate &&
      typeof candidate === 'object' &&
      typeof (candidate as { readonly text?: unknown }).text === 'string',
  );
  return part ? (part as { readonly text: string }).text : undefined;
}

function parseJsonRecord(text: string): Record<string, unknown> | undefined {
  const normalized = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  try {
    const value: unknown = JSON.parse(normalized);
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function readSafeExplanation(
  value: Record<string, unknown> | undefined,
  invariantIds: readonly string[],
): { readonly explanation: string; readonly workedExample?: string } | undefined {
  if (!value || typeof value['explanation'] !== 'string') return undefined;
  const explanation = value['explanation'].trim();
  const workedExample =
    typeof value['workedExample'] === 'string' ? value['workedExample'].trim() : undefined;
  if (
    explanation.length < 10 ||
    explanation.length > 1_000 ||
    (workedExample && workedExample.length > 1_000)
  )
    return undefined;
  const safety = validateCurriculumSafety({ explanation, workedExample, invariantIds });
  if (!safety.safe) return undefined;
  return { explanation, ...(workedExample ? { workedExample } : {}) };
}

function parseTeachBack(
  value: Record<string, unknown> | undefined,
  input: TeachBackInput,
): TeachBackOutput | undefined {
  if (!value) return undefined;
  const candidate = {
    ...value,
    teachBackId: input.teachBackId,
    profileId: input.profileId,
    conceptId: input.conceptId,
    rubricVersion:
      typeof value['rubricVersion'] === 'string'
        ? value['rubricVersion']
        : 'rubric-money-direction-v1',
    evaluatedAt: input.now,
    generationMode: 'live_model',
    evidenceId: randomUUID(),
  };
  const parsed = teachBackOutputSchema.safeParse(candidate);
  if (!parsed.success) return undefined;
  const output = parsed.data;
  const allowedInvariantIds = new Set(
    contractInvariants
      .filter((invariant) => invariant.conceptId === input.conceptId)
      .map((invariant) => invariant.invariantId),
  );
  const allowedMisconceptions = new Set([
    'pin_needed_to_receive_money',
    'appearance_proves_identity',
    'requester_channel_is_enough',
    'urgency_means_authenticity',
    'remote_access_makes_support_safer',
  ]);
  if (
    output.correctClaims.some((claim) => !allowedInvariantIds.has(claim.invariantId)) ||
    output.misconceptions.some((item) => !allowedMisconceptions.has(item.misconceptionId))
  )
    return undefined;
  const safety = validateCurriculumSafety(output);
  return safety.safe ? output : undefined;
}

function boundedLatency(value: number): number {
  return Math.max(0, Math.min(120_000, Math.round(value)));
}
