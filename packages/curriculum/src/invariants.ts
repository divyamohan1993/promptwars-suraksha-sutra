import type { CurriculumInvariant } from './types.js';

/**
 * These statements are the facts the model is allowed to explain or paraphrase.
 * A scenario or teach-back result must keep the linked invariant IDs intact.
 */
export const invariants = [
  {
    invariantId: 'inv-pause-01',
    conceptId: 'pause_before_action',
    statement: {
      hi: 'अचानक आए अनुरोध पर पहले रुकना आपको दिशा और पहचान जाँचने का समय देता है।',
      en: 'Pausing when a request arrives unexpectedly gives you time to check its direction and identity.',
    },
    safeAction: {
      hi: 'तुरंत कार्रवाई न करें; पहले साँस लेकर जाँच का रास्ता चुनें।',
      en: 'Do not act immediately; pause and choose how you will verify.',
    },
    tags: ['pause', 'decision_control', 'verification'],
  },
  {
    invariantId: 'inv-money-direction-01',
    conceptId: 'money_in_vs_money_out',
    statement: {
      hi: 'किसी गुप्त अनुमति कोड से पैसा पाने का हक़ साबित नहीं होता; ऐसा कोड किसी कार्रवाई में पैसे बाहर जाने की अनुमति दे सकता है।',
      en: 'A secret authorisation code does not prove that money is coming in; it can authorise an action that sends money out.',
    },
    safeAction: {
      hi: 'दिशा साफ़ न हो तो भुगतान की अनुमति देने से रुकें और पहले जाँच करें।',
      en: 'If the direction is unclear, pause before authorising a payment and verify first.',
    },
    tags: ['payment_direction', 'authorisation', 'incoming_vs_outgoing'],
  },
  {
    invariantId: 'inv-independent-verification-01',
    conceptId: 'independent_verification',
    statement: {
      hi: 'अनुरोध भेजने वाले के दिए हुए नंबर या बटन से नहीं, बल्कि अपने पास मौजूद स्वतंत्र चैनल से पहचान और अनुरोध की जाँच करें।',
      en: 'Check the identity and request through a channel you find independently, not through a number or button supplied by the requester.',
    },
    safeAction: {
      hi: 'रुकें, अनुरोधकर्ता से अलग रास्ते से जाँच करें, फिर ही कोई कार्रवाई करें।',
      en: 'Pause, verify through a separate channel, and act only after the check.',
    },
    tags: ['independent_verification', 'channel_separation', 'pause'],
  },
  {
    invariantId: 'inv-appearance-01',
    conceptId: 'independent_verification',
    statement: {
      hi: 'साफ़-सुथरा लोगो, नाम या कॉलर-आईडी अपने-आप पहचान का प्रमाण नहीं है।',
      en: 'A polished logo, familiar name, or caller display is not proof of identity by itself.',
    },
    safeAction: {
      hi: 'दिखावे पर भरोसा करने के बजाय स्वतंत्र जाँच करें।',
      en: 'Use an independent check instead of relying on appearance.',
    },
    tags: ['appearance', 'claimed_identity', 'verification'],
  },
  {
    invariantId: 'inv-urgency-01',
    conceptId: 'urgency_and_authority',
    statement: {
      hi: 'तुरंत करने का दबाव या बड़े पद का दावा अनुरोध को सही साबित नहीं करता।',
      en: 'Urgency or a claim of authority does not prove that a request is genuine.',
    },
    safeAction: {
      hi: 'दबाव को संकेत मानें, रुकें और स्वतंत्र जाँच करें।',
      en: 'Treat pressure as a signal to pause and verify independently.',
    },
    tags: ['urgency', 'authority', 'manipulation'],
  },
  {
    invariantId: 'inv-remote-access-01',
    conceptId: 'remote_access_payment_risk',
    statement: {
      hi: 'अनुरोध पर दूर से स्क्रीन देखने वाला ऐप चलाने से सामने वाला स्क्रीन और कार्रवाई देख सकता है; सहायता के लिए उसे अनुमति देना ज़रूरी नहीं है।',
      en: 'A remote-viewing app can expose your screen and actions; you do not need to grant that access to receive help.',
    },
    safeAction: {
      hi: 'दूर से स्क्रीन देखने की अनुमति न दें; ऐप बंद करें और मदद का रास्ता खुद खोजें।',
      en: 'Do not grant remote viewing; close the app and find help through a channel you choose.',
    },
    tags: ['remote_access', 'screen_sharing', 'payment_safety'],
  },
] as const satisfies readonly CurriculumInvariant[];

export const curriculumInvariants = invariants;
export const invariantCatalog = invariants;

export const invariantById = new Map(
  invariants.map((invariant) => [invariant.invariantId, invariant]),
);
