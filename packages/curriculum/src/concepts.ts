import type { CurriculumConcept } from './types.js';

const objective = (hi: string, en: string, hinglish: string, hi_en: string) => ({
  hi,
  en,
  hinglish,
  hi_en,
});

export const concepts = [
  {
    conceptId: 'pause_before_action',
    name: {
      hi: 'कार्रवाई से पहले रुकना',
      en: 'Pause before action',
    },
    learningObjective: objective(
      'अचानक आए अनुरोध पर तुरंत कार्रवाई करने के बजाय जाँच के लिए रुकना।',
      'Pause before acting on an unexpected request so there is time to verify.',
      'Unexpected request par act karne se pehle pause karke verify karo.',
      'Unexpected request पर action से पहले pause करके verify करना।',
    ),
    invariantIds: ['inv-pause-01'],
    prerequisites: [],
    misconceptionIds: [],
    contexts: [
      'pension',
      'messaging',
      'upi',
      'internship',
      'gaming',
      'online_shopping',
      'small_business',
      'qr_payments',
      'customer_support',
    ],
    riskWeight: 0.8,
    reviewImportance: 0.8,
    rubricId: 'rubric-independent-verification-v1',
    safetyClassification: 'preventive_education',
  },
  {
    conceptId: 'money_in_vs_money_out',
    name: {
      hi: 'पैसा आना और पैसा बाहर जाना',
      en: 'Money coming in versus money going out',
    },
    learningObjective: objective(
      'पैसे की दिशा पहचानना और अनुमति देने से पहले जाँच करना।',
      'Distinguish incoming money from an action that authorises money to leave.',
      'Samjho paisa aa raha hai ya action se bahar ja raha hai, phir verify karo.',
      'पैसा in है या out जाने वाला action, यह पहचानकर verify करना।',
    ),
    invariantIds: [
      'inv-money-direction-01',
      'inv-independent-verification-01',
      'inv-appearance-01',
    ],
    prerequisites: ['independent_verification'],
    misconceptionIds: ['pin_needed_to_receive_money', 'appearance_proves_identity'],
    contexts: ['pension', 'messaging', 'upi', 'small_business', 'qr_payments', 'customer_support'],
    riskWeight: 0.95,
    reviewImportance: 0.95,
    rubricId: 'rubric_money_direction_v1',
    safetyClassification: 'preventive_education',
  },
  {
    conceptId: 'independent_verification',
    name: {
      hi: 'स्वतंत्र जाँच',
      en: 'Independent verification',
    },
    learningObjective: objective(
      'अनुरोधकर्ता के दिए रास्ते से अलग रास्ते पर पहचान और अनुरोध की पुष्टि करना।',
      'Confirm identity and request using a channel chosen independently of the requester.',
      'Requester ke diye hue route se alag channel se identity aur request check karo.',
      'अनुरोधकर्ता के दिए रास्ते से अलग independent channel से confirm करना।',
    ),
    invariantIds: ['inv-independent-verification-01', 'inv-appearance-01'],
    prerequisites: ['pause_before_action'],
    misconceptionIds: ['requester_channel_is_enough', 'appearance_proves_identity'],
    contexts: [
      'pension',
      'messaging',
      'upi',
      'internship',
      'gaming',
      'online_shopping',
      'small_business',
      'qr_payments',
      'customer_support',
    ],
    riskWeight: 0.92,
    reviewImportance: 0.92,
    rubricId: 'rubric-independent-verification-v1',
    safetyClassification: 'preventive_education',
  },
  {
    conceptId: 'urgency_and_authority',
    name: {
      hi: 'जल्दबाज़ी और पद का दबाव',
      en: 'Urgency and authority pressure',
    },
    learningObjective: objective(
      'जल्दबाज़ी या बड़े पद के दावे को प्रमाण न मानना और स्वतंत्र जाँच करना।',
      'Recognise pressure as a cue to pause, not proof that a request is authentic.',
      'Urgency ya authority claim ko proof mat samjho; pause karke verify karo.',
      'जल्दी या authority claim को proof न मानकर independent check करना।',
    ),
    invariantIds: ['inv-urgency-01', 'inv-independent-verification-01', 'inv-appearance-01'],
    prerequisites: ['independent_verification'],
    misconceptionIds: ['urgency_means_authenticity', 'requester_channel_is_enough'],
    contexts: ['internship', 'gaming', 'online_shopping', 'messaging', 'customer_support'],
    riskWeight: 0.84,
    reviewImportance: 0.84,
    rubricId: 'rubric-independent-verification-v1',
    safetyClassification: 'preventive_education',
  },
  {
    conceptId: 'remote_access_payment_risk',
    name: {
      hi: 'दूर से स्क्रीन देखने की अनुमति और भुगतान जोखिम',
      en: 'Remote access and payment risk',
    },
    learningObjective: objective(
      'मदद के नाम पर दूर से स्क्रीन देखने की अनुमति देने से पहले जोखिम पहचानना।',
      'Recognise the risk of granting remote screen access during a payment or support request.',
      'Help ke naam par remote screen access dene se pehle risk samjho.',
      'Support या payment request में remote screen access का risk पहचानना।',
    ),
    invariantIds: [
      'inv-remote-access-01',
      'inv-independent-verification-01',
      'inv-money-direction-01',
    ],
    prerequisites: ['independent_verification'],
    misconceptionIds: ['remote_access_makes_support_safer', 'requester_channel_is_enough'],
    contexts: ['small_business', 'qr_payments', 'customer_support', 'messaging'],
    riskWeight: 0.9,
    reviewImportance: 0.9,
    rubricId: 'rubric-independent-verification-v1',
    safetyClassification: 'preventive_education',
  },
] as const satisfies readonly CurriculumConcept[];

export const curriculumConcepts = concepts;
export const conceptCatalog = concepts;
export const conceptById = new Map(concepts.map((concept) => [concept.conceptId, concept]));
