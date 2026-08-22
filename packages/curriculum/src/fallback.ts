import type { FallbackExplanation, FallbackTeachBack, ProfileLocalizedText } from './types.js';
import { fallbackSentence } from './copy.js';

const text = (hi: string, en: string, hinglish: string, hi_en: string): ProfileLocalizedText => ({
  hi,
  en,
  hinglish,
  hi_en,
});

/**
 * Curated fallback content is versioned content, not a pretend model result.
 * The gateway must attach the actual runtime failure reason before displaying
 * it; the deterministic sentence is intentionally exact and user-visible.
 */
export const fallbackExplanation: FallbackExplanation = {
  generationMode: 'curated_fallback',
  modelCallAttempted: true,
  modelCallSucceeded: false,
  fallbackReason: 'provider_error',
  displayLabel: fallbackSentence,
  explanation: text(
    'यह curated fallback है। पैसे की दिशा साफ़ न हो तो अनुमति देने से रुकें। अनुरोधकर्ता से अलग रास्ते से पहचान और अनुरोध की जाँच करें।',
    'This is curated fallback content. If the money direction is unclear, pause before authorising. Check the identity and request through a channel separate from the requester.',
    'Ye curated fallback hai. Money direction clear na ho to authorise karne se pause karo. Requester se alag channel se identity aur request check karo.',
    'यह curated fallback है। Money direction clear न हो तो authorise करने से pause करें। Requester से अलग channel से identity और request check करें।',
  ),
  sourceConceptIds: ['money_in_vs_money_out', 'independent_verification'],
  sourceInvariantIds: [
    'inv-money-direction-01',
    'inv-independent-verification-01',
    'inv-appearance-01',
  ],
};

export const fallbackExplanationByLanguage = fallbackExplanation.explanation;
export const CURATED_FALLBACK_SENTENCE = fallbackSentence;
export const FALLBACK_LABEL = fallbackSentence;

export const fallbackTeachBack: FallbackTeachBack = {
  generationMode: 'curated_fallback',
  modelCallAttempted: true,
  modelCallSucceeded: false,
  fallbackReason: 'provider_error',
  displayLabel: fallbackSentence,
  correctClaims: [
    {
      claim: 'An authorisation can send money out; it does not prove that money is coming in.',
      invariantId: 'inv-money-direction-01',
    },
    {
      claim: 'The request should be checked through a channel chosen independently.',
      invariantId: 'inv-independent-verification-01',
    },
  ],
  partialClaims: [
    {
      claim: 'The request may look familiar.',
      missing: 'Appearance alone is not proof of identity.',
    },
  ],
  misconceptions: [],
  missingLinks: ['Connect a familiar appearance to the need for an independent check.'],
  targetedQuestion: text(
    'कौन-सी कार्रवाई पैसे को बाहर जाने की अनुमति देती है, और जाँच आप कहाँ से करेंगे?',
    'Which action can authorise money to leave, and where will you verify the request?',
    'Kaunsi action money ko out bhej sakti hai, aur request kahan verify karoge?',
    'कौन-सा action money को out भेज सकता है, और request कहाँ verify करेंगे?',
  ),
  rubricVersion: 'rubric-money-direction-v1',
};

export const curatedFallback = {
  explanation: fallbackExplanation,
  teachBack: fallbackTeachBack,
} as const;

export const fallbackContent = curatedFallback;
