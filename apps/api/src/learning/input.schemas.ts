import { z } from 'zod';

export const bootstrapRequestSchema = z
  .object({ selectedProfileId: z.string().trim().min(1).max(128).optional() })
  .strict();

export const diagnosticRequestSchema = z
  .object({
    choiceId: z.string().trim().min(1).max(128),
    confidence: z.number().finite().min(0).max(1),
    responseTimeMs: z.number().int().min(0).max(120_000),
  })
  .strict();

export const scenarioRequestSchema = diagnosticRequestSchema.extend({
  scenarioId: z.string().trim().min(1).max(128).optional(),
});

export const explanationRequestSchema = z.object({ forceFailure: z.boolean().optional() }).strict();

export const teachBackRequestSchema = z
  .object({
    text: z.string().trim().min(1).max(2_000),
    forceFailure: z.boolean().optional(),
  })
  .strict();

export const constitutionRequestSchema = z
  .object({
    goal: z.string().trim().min(1).max(1_000),
    deadline: z.string().datetime({ offset: true }).nullable(),
    sessionMinutes: z.number().int().min(3).max(15),
    interfaceMode: z
      .enum(['standard', 'voice_first', 'fast_interactive', 'transaction_focused'])
      .optional(),
    preferredLanguages: z
      .array(z.enum(['hi', 'en', 'hinglish', 'hi_en']))
      .min(1)
      .max(4),
    readingComplexity: z.enum(['simple', 'standard', 'advanced']),
    explanationDepth: z.enum(['brief', 'conceptual', 'deep']),
    challengePreference: z.enum(['gentle', 'moderate', 'high']),
    relevantContexts: z.array(z.string().trim().min(1).max(64)).min(1).max(12),
    allowVoiceProcessing: z.boolean(),
    allowCrossSessionPersonalization: z.boolean(),
    allowReminderNotifications: z.boolean(),
    personalizationSignals: z
      .object({
        correctness: z.boolean(),
        confidence: z.boolean(),
        responseTime: z.boolean(),
        hintUse: z.boolean(),
        teachBack: z.boolean(),
        transfer: z.boolean(),
      })
      .strict(),
    accessibility: z
      .object({
        keyboardOnly: z.boolean(),
        reducedMotion: z.boolean(),
        captions: z.boolean(),
        textSize: z.enum(['small', 'medium', 'large', 'extra_large']),
        highContrast: z.boolean(),
        screenReaderOptimized: z.boolean(),
      })
      .strict(),
  })
  .strict();

export type BootstrapRequest = z.infer<typeof bootstrapRequestSchema>;
export type DiagnosticRequest = z.infer<typeof diagnosticRequestSchema>;
export type ScenarioRequest = z.infer<typeof scenarioRequestSchema>;
export type ExplanationRequest = z.infer<typeof explanationRequestSchema>;
export type TeachBackRequest = z.infer<typeof teachBackRequestSchema>;
