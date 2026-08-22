import type { CurriculumMisconception } from './types.js';

const profileText = (hi: string, en: string, hinglish: string, hi_en: string) => ({
  hi,
  en,
  hinglish,
  hi_en,
});

export const misconceptions = [
  {
    misconceptionId: 'pin_needed_to_receive_money',
    conceptId: 'money_in_vs_money_out',
    label: profileText(
      'पैसा पाने के लिए अनुमति देना ज़रूरी समझना',
      'Assuming an authorisation is needed to receive money',
      'Money receive karne ke liye authorisation zaroori samajhna',
      'पैसा receive करने के लिए authorisation ज़रूरी मानना',
    ),
    description: profileText(
      'आने वाले पैसे और बाहर जाने वाली अनुमति में फर्क छूट रहा है।',
      'The learner is mixing up incoming money with an authorisation that sends money out.',
      'Incoming money aur outgoing authorisation mix ho rahe hain.',
      'Incoming money और outgoing authorisation का फर्क clear नहीं है।',
    ),
    severityCeiling: 'high',
    triggerPatterns: [
      'receive money needs code',
      'incoming payment needs approval',
      'पैसा पाने के लिए कोड',
    ],
    correctionInvariantIds: ['inv-money-direction-01', 'inv-independent-verification-01'],
    targetedQuestion: profileText(
      'कौन-सी कार्रवाई पैसे को बाहर जाने की अनुमति देती है?',
      'Which action can authorise money to leave the account?',
      'Kaunsi action se paisa account se bahar ja sakta hai?',
      'कौन-सा action account से पैसा out जाने की permission देता है?',
    ),
  },
  {
    misconceptionId: 'appearance_proves_identity',
    conceptId: 'independent_verification',
    label: profileText(
      'लोगो या नाम को पहचान का पूरा प्रमाण मानना',
      'Treating a familiar appearance as proof of identity',
      'Familiar logo ya naam ko identity ka proof samajhna',
      'Familiar logo या नाम को identity proof मानना',
    ),
    description: profileText(
      'दिखावे को स्वतंत्र जाँच से ज़्यादा भरोसेमंद माना जा रहा है।',
      'Appearance is being trusted more than an independent check.',
      'Appearance ko independent check se zyada trust kiya ja raha hai.',
      'Appearance पर independent check से ज्यादा भरोसा हो रहा है।',
    ),
    severityCeiling: 'high',
    triggerPatterns: ['looks official so safe', 'logo proves identity', 'लोगो से पहचान'],
    correctionInvariantIds: ['inv-appearance-01', 'inv-independent-verification-01'],
    targetedQuestion: profileText(
      'अनुरोधकर्ता के दिए रास्ते से अलग कौन-सी जाँच कर सकते हैं?',
      'What check can you make outside the route supplied by the requester?',
      'Requester ke route ke bahar kaunsi check karoge?',
      'Requester के दिए route से अलग कौन-सी independent check होगी?',
    ),
  },
  {
    misconceptionId: 'requester_channel_is_enough',
    conceptId: 'independent_verification',
    label: profileText(
      'अनुरोधकर्ता का दिया संपर्क ही पर्याप्त मानना',
      "Assuming the requester's contact channel is enough",
      'Requester ka diya hua channel hi enough samajhna',
      'Requester का दिया channel ही enough मानना',
    ),
    description: profileText(
      'जाँच के लिए अनुरोधकर्ता से अलग रास्ता चुनने वाली कड़ी छूट रही है।',
      'The learner is missing the need to choose a channel separate from the requester.',
      'Requester se alag channel choose karna miss ho raha hai.',
      'Requester से अलग channel चुनने का link missing है।',
    ),
    severityCeiling: 'high',
    triggerPatterns: [
      'use the number in the message',
      'reply in the same chat',
      'यहीं जवाब देकर जाँच',
    ],
    correctionInvariantIds: ['inv-independent-verification-01'],
    targetedQuestion: profileText(
      'स्वतंत्र जाँच के लिए संपर्क का रास्ता आप कहाँ से चुनेंगे?',
      'Where would you choose a channel for an independent check?',
      'Independent check ke liye channel kahan se choose karoge?',
      'Independent check के लिए channel किस अलग source से चुनेंगे?',
    ),
  },
  {
    misconceptionId: 'urgency_means_authenticity',
    conceptId: 'urgency_and_authority',
    label: profileText(
      'जल्दबाज़ी को असली होने का प्रमाण मानना',
      'Treating urgency as proof that a request is genuine',
      'Urgency ko genuine hone ka proof samajhna',
      'Urgency को genuine होने का proof मानना',
    ),
    description: profileText(
      'तुरंत करने का दबाव स्वतंत्र जाँच से पहले निर्णय करा रहा है।',
      'Pressure to act immediately is replacing an independent check.',
      'Jaldi act karne ka pressure independent check ko replace kar raha hai.',
      'Immediate action का pressure independent check की जगह ले रहा है।',
    ),
    severityCeiling: 'medium',
    triggerPatterns: ['must act now means real', 'urgent so authentic', 'जल्दी है इसलिए सही'],
    correctionInvariantIds: ['inv-urgency-01', 'inv-independent-verification-01'],
    targetedQuestion: profileText(
      'जल्दी करने का दबाव हो तो आपका पहला सुरक्षित कदम क्या होगा?',
      'When there is pressure to hurry, what is your first safe action?',
      'Jaldi ka pressure ho to pehla safe action kya hoga?',
      'Urgency हो तो पहला safe action क्या होगा?',
    ),
  },
  {
    misconceptionId: 'remote_access_makes_support_safer',
    conceptId: 'remote_access_payment_risk',
    label: profileText(
      'मदद पाने के लिए दूर से स्क्रीन दिखाना सुरक्षित मानना',
      'Assuming remote screen access makes support safer',
      'Support ke liye remote screen access ko safer samajhna',
      'Support के लिए remote screen access को safer मानना',
    ),
    description: profileText(
      'स्क्रीन और कार्रवाई दिखाई देने के जोखिम को मदद के लाभ से ढक दिया जा रहा है।',
      'The risk of exposing the screen and actions is being overlooked because help was promised.',
      'Help ke promise ki wajah se screen aur actions expose hone ka risk miss ho raha hai.',
      'Help promise के कारण screen और actions expose होने का risk छूट रहा है।',
    ),
    severityCeiling: 'high',
    triggerPatterns: [
      'remote app helps support',
      'screen access is required',
      'स्क्रीन दिखाना ज़रूरी',
    ],
    correctionInvariantIds: ['inv-remote-access-01', 'inv-independent-verification-01'],
    targetedQuestion: profileText(
      'मदद के लिए दूर से स्क्रीन देखने की अनुमति देना क्यों टालेंगे?',
      'Why would you avoid granting remote screen access for help?',
      'Help ke liye remote screen access kyun avoid karoge?',
      'Help के लिए remote screen access क्यों avoid करेंगे?',
    ),
  },
] as const satisfies readonly CurriculumMisconception[];

export const curriculumMisconceptions = misconceptions;
export const misconceptionCatalog = misconceptions;
export const misconceptionById = new Map(
  misconceptions.map((misconception) => [misconception.misconceptionId, misconception]),
);
