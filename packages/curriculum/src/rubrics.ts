import type { CurriculumRubric } from './types.js';

const profileText = (hi: string, en: string, hinglish: string, hi_en: string) => ({
  hi,
  en,
  hinglish,
  hi_en,
});

export const rubrics = [
  {
    rubricId: 'rubric_money_direction_v1',
    version: 'rubric-money-direction-v1',
    conceptIds: ['money_in_vs_money_out'],
    invariantIds: [
      'inv-money-direction-01',
      'inv-independent-verification-01',
      'inv-appearance-01',
    ],
    criteria: [
      {
        criterionId: 'direction',
        description: profileText(
          'आने वाले पैसे और बाहर जाने वाली अनुमति में फर्क बताता है।',
          'Distinguishes incoming money from an authorisation that sends money out.',
          'Incoming money aur outgoing authorisation ka difference batata hai.',
          'Incoming money और outgoing authorisation का difference बताता है।',
        ),
        points: 2,
      },
      {
        criterionId: 'independent-check',
        description: profileText(
          'अनुरोधकर्ता से अलग चैनल पर जाँच बताता है।',
          'Names a check through a channel separate from the requester.',
          'Requester se alag channel par check batata hai.',
          'Requester से अलग channel पर check बताता है।',
        ),
        points: 2,
      },
      {
        criterionId: 'appearance',
        description: profileText(
          'नाम या दिखावे को अकेला प्रमाण नहीं मानता।',
          'Does not treat a name or appearance as proof by itself.',
          'Naam ya appearance ko akela proof nahi maanta.',
          'नाम या appearance को अकेला proof नहीं मानता।',
        ),
        points: 1,
      },
    ],
    targetedQuestion: profileText(
      'अगर कोई अनुरोध पैसा पाने के लिए अनुमति माँगे, तो दिशा कैसे जाँचेंगे?',
      'If a request asks for an authorisation to receive money, how will you check the direction?',
      'Agar receive karne ke liye authorisation maange, direction kaise check karoge?',
      'Receive करने के लिए authorisation माँगे तो direction कैसे verify करेंगे?',
    ),
    feedbackTemplate: profileText(
      'दिशा और स्वतंत्र जाँच को अलग-अलग बोलकर समझाएँ।',
      'Explain the direction and the independent check separately.',
      'Direction aur independent check ko separately explain karo.',
      'Direction और independent check को अलग करके explain करें।',
    ),
  },
  {
    rubricId: 'rubric-independent-verification-v1',
    version: 'rubric-independent-verification-v1',
    conceptIds: ['independent_verification', 'urgency_and_authority', 'remote_access_payment_risk'],
    invariantIds: [
      'inv-pause-01',
      'inv-independent-verification-01',
      'inv-appearance-01',
      'inv-urgency-01',
      'inv-remote-access-01',
      'inv-money-direction-01',
    ],
    criteria: [
      {
        criterionId: 'pause',
        description: profileText(
          'दबाव में रुकने का सुरक्षित कदम बताता है।',
          'Names pausing as the safe action under pressure.',
          'Pressure me pause karna safe action batata hai.',
          'Pressure में pause करना safe action बताता है।',
        ),
        points: 1,
      },
      {
        criterionId: 'separate-channel',
        description: profileText(
          'अनुरोधकर्ता से अलग चुना हुआ चैनल बताता है।',
          'Names a channel chosen separately from the requester.',
          'Requester se alag chosen channel batata hai.',
          'Requester से अलग chosen channel बताता है।',
        ),
        points: 2,
      },
      {
        criterionId: 'appearance-not-proof',
        description: profileText(
          'नाम, लोगो या urgency को प्रमाण नहीं मानता।',
          'Does not treat a name, logo, or urgency as proof.',
          'Naam, logo ya urgency ko proof nahi maanta.',
          'नाम, logo या urgency को proof नहीं मानता।',
        ),
        points: 1,
      },
      {
        criterionId: 'safe-action',
        description: profileText(
          'अनुमति, स्क्रीन-दृश्य या भुगतान से पहले स्वतंत्र जाँच करता है।',
          'Verifies independently before authorising, exposing a screen, or paying.',
          'Authorise, screen share ya pay karne se pehle independently verify karta hai.',
          'Authorise, screen share या pay करने से पहले independent verify करता है।',
        ),
        points: 2,
      },
    ],
    targetedQuestion: profileText(
      'अनुरोधकर्ता के दिए रास्ते से अलग जाँच करने पर आपको क्या पता चलेगा?',
      'What can an independent check reveal that the requester’s route cannot?',
      'Independent check se kya pata chalega jo requester ke route se nahi chalega?',
      'Independent check से क्या पता चलेगा जो requester के route से नहीं मिलेगा?',
    ),
    feedbackTemplate: profileText(
      'सुरक्षित क्रम है: रुकें, अलग रास्ते से जाँचें, फिर कार्रवाई तय करें।',
      'The safe sequence is: pause, check separately, then decide whether to act.',
      'Safe sequence: pause, alag route se check, phir action decide karo.',
      'Safe sequence: pause, अलग route से check, फिर action decide करें।',
    ),
  },
] as const satisfies readonly CurriculumRubric[];

export const curriculumRubrics = rubrics;
export const rubricCatalog = rubrics;
export const rubricById = new Map(rubrics.map((rubric) => [rubric.rubricId, rubric]));
