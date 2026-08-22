import type { CurriculumScenario, ProfileLocalizedText, ScenarioChoice } from './types.js';
import { BASE_SCENARIO_ID, TRANSFER_SCENARIO_IDS } from './ids.js';

const text = (hi: string, en: string, hinglish: string, hi_en: string): ProfileLocalizedText => ({
  hi,
  en,
  hinglish,
  hi_en,
});

const constraints = {
  activeLinks: false,
  realOrganizations: false,
  realPhoneNumbers: false,
  realCredentials: false,
  operationalFraudInstructions: false,
} as const;

const choice = (
  id: string,
  classification: 'safe' | 'unsafe',
  values: ProfileLocalizedText,
  feedback: ProfileLocalizedText,
): ScenarioChoice => ({ id, classification, text: values, feedback });

const unsafeChoice = choice(
  'approve-now',
  'unsafe',
  text(
    'अभी अनुमति दें, क्योंकि संदेश जल्दी करने को कह रहा है।',
    'Approve now because the message says it is urgent.',
    'Abhi approve karo, message urgent bol raha hai.',
    'अभी approve करें, message urgent बोल रहा है।',
  ),
  text(
    'जल्दबाज़ी पहचान या पैसे की दिशा का प्रमाण नहीं है।',
    'Urgency does not prove identity or the direction of money.',
    'Urgency identity ya money direction ka proof nahi hai.',
    'Urgency identity या money direction का proof नहीं है।',
  ),
);

const safeChoice = choice(
  'pause-verify',
  'safe',
  text(
    'रुकें और अनुरोधकर्ता से अलग रास्ते से जाँच करें।',
    'Pause and verify through a channel separate from the requester.',
    'Pause karo aur requester se alag channel se verify karo.',
    'Pause करें और requester से अलग channel से verify करें।',
  ),
  text(
    'यह दिशा और पहचान दोनों जाँचने का सुरक्षित तरीका है।',
    'This checks both the direction of money and the identity of the requester.',
    'Isse money direction aur requester identity dono check hote hain.',
    'इससे money direction और requester identity दोनों check होते हैं।',
  ),
);

const baseInvariantIds = [
  'inv-money-direction-01',
  'inv-independent-verification-01',
  'inv-appearance-01',
] as const;

const makeScenario = (
  scenario: Omit<
    CurriculumScenario,
    | 'choices'
    | 'safestChoiceId'
    | 'safestAction'
    | 'constraints'
    | 'invariantIds'
    | 'feedbackRubricId'
  >,
): CurriculumScenario => ({
  ...scenario,
  invariantIds: baseInvariantIds,
  choices: [unsafeChoice, safeChoice],
  safestChoiceId: 'pause-verify',
  safestAction: text(
    'रुकें, अनुरोधकर्ता से अलग रास्ते से जाँच करें, फिर ही अनुमति दें।',
    'Pause, verify separately from the requester, and authorise only after the check.',
    'Pause karo, requester se alag verify karo, phir hi authorise karo.',
    'Pause करें, requester से अलग verify करें, फिर ही authorise करें।',
  ),
  feedbackRubricId: 'rubric_money_direction_v1',
  constraints,
});

/**
 * One base simulator and one visually distinct transfer for each required
 * profile context. The invariant IDs, rubric, and safest action are shared;
 * only the learner-facing setting and visual presentation change.
 */
export const scenarios = [
  makeScenario({
    scenarioId: BASE_SCENARIO_ID,
    trainingLabel: 'TRAINING SIMULATION',
    kind: 'base',
    title: text(
      'भुगतान की दिशा जाँचें',
      'Payment direction decision',
      'Payment kis direction me ja raha hai?',
      'Payment की direction check करें',
    ),
    conceptIds: ['money_in_vs_money_out', 'independent_verification'],
    context: 'small_merchant',
    channel: 'fictional_chat',
    visual: 'chat-bubble',
    manipulationPatterns: ['urgency', 'claimed_authority', 'familiar_appearance'],
    unsafeRequestCategory: 'authorize_outgoing_action',
    prompt: text(
      'काल्पनिक सहायता चैट कहती है: ‘आने वाला भुगतान पूरा करने के लिए अभी अनुमति दें।’ नाम और रंग भरोसेमंद लगते हैं। आप क्या करेंगे?',
      'A fictional support chat says: ‘Approve now to complete the incoming payment.’ The name and colours look familiar. What will you do?',
      'Fictional support chat bolta hai: ‘Incoming payment complete karne ke liye abhi approve karo.’ Name aur colours familiar lag rahe hain. Kya karoge?',
      'काल्पनिक support chat कहता है: ‘Incoming payment complete करने के लिए अभी approve करें।’ Name और colours familiar लगते हैं। क्या करेंगे?',
    ),
    transferScenarioIds: TRANSFER_SCENARIO_IDS,
  }),
  makeScenario({
    scenarioId: 'scenario-savita-pension-001',
    trainingLabel: 'TRAINING SIMULATION',
    kind: 'transfer',
    title: text(
      'पेंशन सूचना-पर्ची की जाँच',
      'Check a pension notice',
      'Pension notice ko check karo',
      'Pension notice को check करें',
    ),
    conceptIds: ['money_in_vs_money_out', 'independent_verification'],
    context: 'pension',
    channel: 'fictional_notice',
    visual: 'printed-notice',
    manipulationPatterns: ['urgency', 'claimed_authority', 'familiar_appearance'],
    unsafeRequestCategory: 'authorize_outgoing_action',
    prompt: text(
      'एक काल्पनिक पेंशन पर्ची कहती है कि लाभ पाने के लिए अभी भुगतान की अनुमति दें। पर्ची पर साफ़ नाम है। आपकी सुरक्षित पसंद क्या है?',
      'A fictional pension notice says to authorise a payment now to receive a benefit. It has a polished name. What is your safe choice?',
      'Fictional pension notice bolta hai ki benefit receive karne ke liye abhi payment approve karo. Naam polished hai. Safe choice kya hai?',
      'काल्पनिक pension notice कहता है कि benefit receive करने के लिए अभी payment approve करें। नाम polished है। Safe choice क्या है?',
    ),
    transferScenarioIds: [],
  }),
  makeScenario({
    scenarioId: 'scenario-savita-messaging-001',
    trainingLabel: 'TRAINING SIMULATION',
    kind: 'transfer',
    title: text(
      'परिवार-जैसे संदेश की जाँच',
      'Check a family-like message',
      'Family-jaisa message check karo',
      'Family-जैसे message को check करें',
    ),
    conceptIds: ['money_in_vs_money_out', 'independent_verification'],
    context: 'messaging',
    channel: 'fictional_chat',
    visual: 'notification-card',
    manipulationPatterns: ['urgency', 'familiar_appearance'],
    unsafeRequestCategory: 'authorize_outgoing_action',
    prompt: text(
      'काल्पनिक चैट में परिचित नाम से कहा गया है कि मदद पाने के लिए भुगतान की अनुमति दें। नाम देखकर तुरंत भरोसा करेंगे या पहले अलग से जाँच करेंगे?',
      'A fictional chat using a familiar name asks for a payment authorisation to provide help. Will you trust the name or check separately first?',
      'Fictional chat familiar name se payment approve karne ko bolta hai. Name par trust karoge ya pehle separately check karoge?',
      'काल्पनिक chat familiar name से payment authorise करने को कहता है। Name पर trust करेंगे या पहले अलग check करेंगे?',
    ),
    transferScenarioIds: [],
  }),
  makeScenario({
    scenarioId: 'scenario-savita-upi-001',
    trainingLabel: 'TRAINING SIMULATION',
    kind: 'transfer',
    title: text(
      'भुगतान अनुरोध कार्ड की जाँच',
      'Check a payment request card',
      'Payment request card check karo',
      'Payment request card को check करें',
    ),
    conceptIds: ['money_in_vs_money_out', 'independent_verification'],
    context: 'upi',
    channel: 'fictional_notification',
    visual: 'payment-card',
    manipulationPatterns: ['urgency', 'claimed_authority', 'familiar_appearance'],
    unsafeRequestCategory: 'authorize_outgoing_action',
    prompt: text(
      'काल्पनिक भुगतान कार्ड पर लिखा है: ‘पैसा पाने के लिए इस अनुरोध को अभी स्वीकार करें।’ रंग और लेआउट साफ़ हैं। आप पहले क्या जाँचेंगे?',
      'A fictional payment card says: ‘Accept this request now to receive money.’ The colours and layout look polished. What will you check first?',
      'Fictional payment card bolta hai: ‘Money receive karne ke liye request abhi accept karo.’ Colours aur layout polished hain. Pehle kya check karoge?',
      'काल्पनिक payment card कहता है: ‘Money receive करने के लिए request अभी accept करें।’ Colours और layout polished हैं। पहले क्या check करेंगे?',
    ),
    transferScenarioIds: [],
  }),
  makeScenario({
    scenarioId: 'scenario-job-014',
    trainingLabel: 'TRAINING SIMULATION',
    kind: 'transfer',
    title: text(
      'इंटर्नशिप ऑफ़र की जाँच',
      'Check an internship offer',
      'Internship offer check karo',
      'Internship offer को check करें',
    ),
    conceptIds: ['money_in_vs_money_out', 'independent_verification'],
    context: 'internship',
    channel: 'fictional_notice',
    visual: 'job-offer-card',
    manipulationPatterns: ['urgency', 'claimed_authority', 'reward'],
    unsafeRequestCategory: 'authorize_outgoing_action',
    prompt: text(
      'एक काल्पनिक इंटर्नशिप कार्ड कहता है कि सीट बचाने के लिए अभी भुगतान की अनुमति दें। पद और इनाम अच्छे लगते हैं। आप कैसे जाँचेंगे?',
      'A fictional internship card asks you to authorise a payment now to hold a seat. The role and reward look attractive. How will you check?',
      'Fictional internship card seat hold karne ke liye abhi payment approve karne bolta hai. Role aur reward attractive hain. Kaise check karoge?',
      'काल्पनिक internship card seat hold करने के लिए अभी payment authorise करने को कहता है। Role और reward attractive हैं। कैसे check करेंगे?',
    ),
    transferScenarioIds: [],
  }),
  makeScenario({
    scenarioId: 'scenario-arjun-gaming-001',
    trainingLabel: 'TRAINING SIMULATION',
    kind: 'transfer',
    title: text(
      'गेम इनाम पॉप-अप की जाँच',
      'Check a game reward pop-up',
      'Game reward pop-up check karo',
      'Game reward pop-up को check करें',
    ),
    conceptIds: ['money_in_vs_money_out', 'independent_verification'],
    context: 'gaming',
    channel: 'fictional_notification',
    visual: 'game-reward-card',
    manipulationPatterns: ['urgency', 'reward', 'familiar_appearance'],
    unsafeRequestCategory: 'authorize_outgoing_action',
    prompt: text(
      'काल्पनिक गेम पॉप-अप कहता है कि इनाम पाने के लिए भुगतान अनुरोध तुरंत स्वीकार करें। चमकदार डिज़ाइन देखकर आप क्या करेंगे?',
      'A fictional game pop-up says to accept a payment request immediately to receive a reward. What will you do despite the shiny design?',
      'Fictional game pop-up reward ke liye payment request immediately accept karne bolta hai. Shiny design ke baad kya karoge?',
      'काल्पनिक game pop-up reward के लिए payment request immediately accept करने को कहता है। Shiny design के बावजूद क्या करेंगे?',
    ),
    transferScenarioIds: [],
  }),
  makeScenario({
    scenarioId: 'scenario-arjun-online-shopping-001',
    trainingLabel: 'TRAINING SIMULATION',
    kind: 'transfer',
    title: text(
      'डिलीवरी स्थिति कार्ड की जाँच',
      'Check a delivery status card',
      'Delivery status card check karo',
      'Delivery status card को check करें',
    ),
    conceptIds: ['money_in_vs_money_out', 'independent_verification'],
    context: 'online_shopping',
    channel: 'fictional_notification',
    visual: 'delivery-status-card',
    manipulationPatterns: ['urgency', 'claimed_authority', 'familiar_appearance'],
    unsafeRequestCategory: 'authorize_outgoing_action',
    prompt: text(
      'काल्पनिक डिलीवरी कार्ड कहता है कि पार्सल पाने के लिए भुगतान अनुरोध अभी स्वीकार करें। स्थिति असली जैसी दिखती है। आप क्या जाँचेंगे?',
      'A fictional delivery card says to accept a payment request now to receive a parcel. The status looks realistic. What will you check?',
      'Fictional delivery card parcel receive karne ke liye payment request abhi accept karne bolta hai. Status real jaisa lagta hai. Kya check karoge?',
      'काल्पनिक delivery card parcel receive करने के लिए payment request अभी accept करने को कहता है। Status real जैसा लगता है। क्या check करेंगे?',
    ),
    transferScenarioIds: [],
  }),
  makeScenario({
    scenarioId: 'scenario-ramesh-small-business-001',
    trainingLabel: 'TRAINING SIMULATION',
    kind: 'transfer',
    title: text(
      'दुकान के ऑर्डर भुगतान की जाँच',
      'Check a shop order payment',
      'Shop order payment check karo',
      'Shop order payment को check करें',
    ),
    conceptIds: ['money_in_vs_money_out', 'independent_verification'],
    context: 'small_business',
    channel: 'fictional_chat',
    visual: 'shop-counter-note',
    manipulationPatterns: ['urgency', 'claimed_authority', 'familiar_appearance'],
    unsafeRequestCategory: 'authorize_outgoing_action',
    prompt: text(
      'काल्पनिक ग्राहक-संदेश कहता है कि ऑर्डर की रकम पाने के लिए भुगतान अनुमति अभी दें। दुकान व्यस्त है। सुरक्षित निर्णय क्या है?',
      'A fictional customer message says to authorise a payment now to receive an order amount. The shop is busy. What is the safe decision?',
      'Fictional customer message order amount receive karne ke liye payment approve karne bolta hai. Shop busy hai. Safe decision kya hai?',
      'काल्पनिक customer message order amount receive करने के लिए payment authorise करने को कहता है। Shop busy है। Safe decision क्या है?',
    ),
    transferScenarioIds: [],
  }),
  makeScenario({
    scenarioId: 'scenario-ramesh-qr-payments-001',
    trainingLabel: 'TRAINING SIMULATION',
    kind: 'transfer',
    title: text(
      'QR-जैसे प्रशिक्षण कार्ड की जाँच',
      'Check a QR-style training card',
      'QR-style training card check karo',
      'QR-style training card को check करें',
    ),
    conceptIds: ['money_in_vs_money_out', 'independent_verification'],
    context: 'qr_payments',
    channel: 'fictional_notification',
    visual: 'qr-style-training-card',
    manipulationPatterns: ['urgency', 'familiar_appearance'],
    unsafeRequestCategory: 'authorize_outgoing_action',
    prompt: text(
      'काल्पनिक QR-जैसे प्रशिक्षण कार्ड पर लिखा है कि ग्राहक से रकम पाने के लिए भुगतान अनुरोध स्वीकार करें। कार्ड स्कैन करने के बजाय दिशा कैसे जाँचेंगे?',
      "A fictional QR-style training card says to accept a payment request to receive a customer's money. How will you check the direction without scanning anything?",
      'Fictional QR-style training card customer ka money receive karne ke liye payment request accept karne bolta hai. Scan kiye bina direction kaise check karoge?',
      'काल्पनिक QR-style training card customer का money receive करने के लिए payment request accept करने को कहता है। Scan किए बिना direction कैसे check करेंगे?',
    ),
    transferScenarioIds: [],
  }),
  makeScenario({
    scenarioId: 'scenario-ramesh-customer-support-001',
    trainingLabel: 'TRAINING SIMULATION',
    kind: 'transfer',
    title: text(
      'सहायता कॉल-सारांश की जाँच',
      'Check a support-call summary',
      'Support call summary check karo',
      'Support call summary को check करें',
    ),
    conceptIds: ['money_in_vs_money_out', 'independent_verification'],
    context: 'customer_support',
    channel: 'fictional_call_summary',
    visual: 'support-call-summary',
    manipulationPatterns: ['urgency', 'claimed_authority', 'familiar_appearance'],
    unsafeRequestCategory: 'authorize_outgoing_action',
    prompt: text(
      'काल्पनिक सहायता कॉल-सारांश कहता है कि समस्या ठीक करने के लिए भुगतान की अनुमति दें। आवाज़ आत्मविश्वासी थी। आप पहले क्या करेंगे?',
      'A fictional support-call summary says to authorise a payment to fix a problem. The voice sounded confident. What will you do first?',
      'Fictional support-call summary payment approve karke problem fix karne bolta hai. Voice confident thi. Pehle kya karoge?',
      'काल्पनिक support-call summary problem fix करने के लिए payment authorise करने को कहता है। Voice confident थी। पहले क्या करेंगे?',
    ),
    transferScenarioIds: [],
  }),
] as const satisfies readonly CurriculumScenario[];

export const curriculumScenarios = scenarios;
export const scenarioCatalog = scenarios;
export const baseScenario = scenarios[0];
export const transferScenarios = scenarios.filter((scenario) => scenario.kind === 'transfer');
export const scenarioById = new Map(scenarios.map((scenario) => [scenario.scenarioId, scenario]));

export const profileScenarioMap = {
  'profile-savita': [
    'scenario-savita-pension-001',
    'scenario-savita-messaging-001',
    'scenario-savita-upi-001',
  ],
  'profile-arjun': [
    'scenario-job-014',
    'scenario-arjun-gaming-001',
    'scenario-arjun-online-shopping-001',
  ],
  'profile-ramesh': [
    'scenario-ramesh-small-business-001',
    'scenario-ramesh-qr-payments-001',
    'scenario-ramesh-customer-support-001',
  ],
} as const;
