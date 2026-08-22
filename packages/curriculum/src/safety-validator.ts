import { CURRICULUM_ID_ALLOWLIST } from './ids.js';
import type { CurriculumIdAllowlist, SafetyValidationResult, SafetyViolation } from './types.js';

const URL_PATTERN = /(?:https?|ftp):\/\/|\bwww\.|\b[a-z0-9-]+\.(?:com|in|org|net|co|gov|io|app)\b/i;
const PHONE_PATTERN = /(?:\+?91[\s.-]?)?[6-9]\d{9}\b|\b[6-9]\d{2}[\s.-]\d{3}[\s.-]\d{4}\b/;
const HTML_OR_SCRIPT_PATTERN =
  /<\/?[a-z][^>]*>|&lt;\/?[a-z][^&]*&gt;|javascript\s*:|on(?:error|load|click)\s*=/i;
const REAL_INSTITUTION_PATTERN =
  /\b(?:state\s+bank\s+of\s+india|sbi|hdfc|icici|axis\s+bank|rbi|npci|paytm|phonepe|google\s+pay|gpay|amazon\s+pay|aadhaar|uidai|irctc)\b/i;
const PROMPT_INJECTION_PATTERN =
  /\b(?:ignore|disregard)\s+(?:all\s+|any\s+|the\s+|your\s+|previous\s+|prior\s+)?(?:instructions?|rules?|policy|messages?)\b|\b(?:system\s+prompt|developer\s+message|hidden\s+reasoning|jailbreak)\b|\breveal\s+(?:the\s+)?(?:prompt|policy|hidden)|\byou\s+are\s+now\b/i;
const OPERATIONAL_PATTERN =
  /\b(?:step\s*\d|step-by-step|how\s+to\b|instructions?\s+to\b|disable\s+(?:security|antivirus|safety)|install\s+(?:a\s+)?remote|create\s+(?:a\s+)?phish|credential\s+harvest|harvest\s+(?:credentials|passwords)|collect\s+(?:an?\s+)?(?:otp|pin|password)|run\s+(?:this|the)\s+command|curl\s+|wget\s+|powershell\b|base64\b|sql\s+injection|malware\b|keylogger\b|bypass\s+(?:security|verification)|evad(?:e|ing)\s+(?:detection|security))\b/i;

const CREDENTIAL_TERM =
  /\b(?:password|passcode|otp|one[- ]time\s+password|pin|cvv|security\s+code|authentication\s+code|secret\s+code|credential(?:s)?)\b|पासवर्ड|ओटीपी|पिन/i;
const CREDENTIAL_REQUEST =
  /\b(?:please\s+)?(?:share|send|enter|type|provide|give|tell|reveal|submit|upload|paste|forward|read\s+out|capture|scan|request|ask\s+for)\b|\b(?:माँगें|मांगें|बताएँ|बताएं|भेजें|दें|डालें|शेयर|साझा|माँगना|मांगना)\b/i;
const NEGATED_CREDENTIAL_REQUEST =
  /\b(?:never|do\s+not|don't|not|without|avoid|refuse|cannot|can't|no|kabhi|mat|nahi|na)\b|(?:कभी|नहीं|न|बिना|मत|मना)/i;

type IdKind = keyof Pick<
  CurriculumIdAllowlist,
  'conceptIds' | 'invariantIds' | 'misconceptionIds' | 'rubricIds' | 'scenarioIds'
>;

const ID_FIELDS: Readonly<Record<string, IdKind>> = {
  conceptId: 'conceptIds',
  conceptIds: 'conceptIds',
  sourceConceptId: 'conceptIds',
  sourceConceptIds: 'conceptIds',
  invariantId: 'invariantIds',
  invariantIds: 'invariantIds',
  sourceInvariantId: 'invariantIds',
  sourceInvariantIds: 'invariantIds',
  correctionInvariantIds: 'invariantIds',
  misconceptionId: 'misconceptionIds',
  misconceptionIds: 'misconceptionIds',
  rubricId: 'rubricIds',
  feedbackRubricId: 'rubricIds',
  scenarioId: 'scenarioIds',
  transferScenarioId: 'scenarioIds',
  transferScenarioIds: 'scenarioIds',
};

const asPath = (path: string, key: string | number): string =>
  typeof key === 'number' ? `${path}[${key}]` : path ? `${path}.${key}` : key;

const addViolation = (
  violations: SafetyViolation[],
  code: SafetyViolation['code'],
  path: string,
  message: string,
  match?: string,
): void => {
  violations.push(match === undefined ? { code, path, message } : { code, path, message, match });
};

const sentenceHasNegatedCredentialRequest = (sentence: string): boolean => {
  if (!CREDENTIAL_TERM.test(sentence) || !CREDENTIAL_REQUEST.test(sentence)) {
    return false;
  }

  const requestMatch = sentence.match(CREDENTIAL_REQUEST);
  if (!requestMatch || requestMatch.index === undefined) {
    return false;
  }
  const aroundRequest = sentence.slice(
    Math.max(0, requestMatch.index - 32),
    requestMatch.index + requestMatch[0].length + 42,
  );
  return NEGATED_CREDENTIAL_REQUEST.test(aroundRequest);
};

const scanText = (value: string, path: string, violations: SafetyViolation[]): void => {
  const normalized = value.normalize('NFKC');
  const checks: ReadonlyArray<readonly [SafetyViolation['code'], RegExp, string]> = [
    ['url', URL_PATTERN, 'Links and domain names are not allowed in training content.'],
    ['phone_number', PHONE_PATTERN, 'Phone numbers are not allowed in training content.'],
    [
      'real_institution',
      REAL_INSTITUTION_PATTERN,
      'Real institutions are not allowed in fictional scenarios.',
    ],
    [
      'html_or_script',
      HTML_OR_SCRIPT_PATTERN,
      'HTML, script, and executable URI content are not allowed.',
    ],
    [
      'prompt_injection',
      PROMPT_INJECTION_PATTERN,
      'Prompt-injection language is not allowed in model-facing content.',
    ],
    [
      'operational_instruction',
      OPERATIONAL_PATTERN,
      'Operational fraud or evasion instructions are not allowed.',
    ],
  ];

  for (const [code, pattern, message] of checks) {
    const match = normalized.match(pattern);
    if (match?.[0]) {
      addViolation(violations, code, path, message, match[0]);
    }
  }

  for (const sentence of normalized.split(/[.!?।\n]+/u)) {
    if (sentenceHasNegatedCredentialRequest(sentence)) {
      continue;
    }
    if (CREDENTIAL_TERM.test(sentence) && CREDENTIAL_REQUEST.test(sentence)) {
      const match = sentence.match(CREDENTIAL_REQUEST)?.[0] ?? 'credential request';
      addViolation(
        violations,
        'credential_request',
        path,
        'Requests to provide, send, or enter credentials are not allowed.',
        match,
      );
      break;
    }
  }
};

const validateIds = (
  value: unknown,
  path: string,
  allowlist: CurriculumIdAllowlist,
  violations: SafetyViolation[],
): void => {
  if (!value || typeof value !== 'object') {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateIds(item, asPath(path, index), allowlist, violations));
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = asPath(path, key);
    const kind = ID_FIELDS[key];
    if (kind) {
      const ids = Array.isArray(child) ? child : [child];
      for (const id of ids) {
        if (typeof id === 'string' && !allowlist[kind].has(id)) {
          addViolation(
            violations,
            'unknown_id',
            childPath,
            `Unknown ${kind.slice(0, -1)}: ${id}.`,
            id,
          );
        }
      }
    }
    validateIds(child, childPath, allowlist, violations);
  }
};

const scanAllText = (value: unknown, path: string, violations: SafetyViolation[]): void => {
  if (typeof value === 'string') {
    scanText(value, path, violations);
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanAllText(item, asPath(path, index), violations));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    scanAllText(child, asPath(path, key), violations);
  }
};

const validateScenarioShape = (
  value: Record<string, unknown>,
  path: string,
  violations: SafetyViolation[],
): void => {
  if ('scenarioId' in value && value.trainingLabel !== 'TRAINING SIMULATION') {
    addViolation(
      violations,
      'missing_training_label',
      asPath(path, 'trainingLabel'),
      'Every scenario must display TRAINING SIMULATION.',
    );
  }

  if (
    'scenarioId' in value &&
    Array.isArray(value.invariantIds) &&
    value.invariantIds.length === 0
  ) {
    addViolation(
      violations,
      'missing_invariant',
      asPath(path, 'invariantIds'),
      'A scenario must preserve at least one approved invariant.',
    );
  }

  const constraints = value.constraints;
  if (constraints && typeof constraints === 'object' && !Array.isArray(constraints)) {
    for (const [key, constraint] of Object.entries(constraints)) {
      if (constraint !== false) {
        addViolation(
          violations,
          'unsafe_constraint',
          asPath(path, `constraints.${key}`),
          'Scenario safety constraints must remain false.',
        );
      }
    }
  }

  const choices = value.choices;
  const safestChoiceId = value.safestChoiceId;
  if (Array.isArray(choices) && typeof safestChoiceId === 'string') {
    const safestChoice = choices.find(
      (candidate) => candidate && typeof candidate === 'object' && candidate.id === safestChoiceId,
    );
    if (!safestChoice || safestChoice.classification !== 'safe') {
      addViolation(
        violations,
        'invalid_safest_choice',
        asPath(path, 'safestChoiceId'),
        'The safest choice must exist and be classified safe.',
      );
    }
  }
};

export interface SafetyValidatorOptions {
  readonly allowlist?: CurriculumIdAllowlist;
  readonly requireTrainingLabel?: boolean;
}

/**
 * Validate content immediately before it can be displayed or sent to a model.
 * The validator is intentionally fail-closed for IDs and dangerous text.
 */
export const validateCurriculumSafety = (
  value: unknown,
  options: SafetyValidatorOptions = {},
): SafetyValidationResult => {
  const violations: SafetyViolation[] = [];
  const allowlist = options.allowlist ?? CURRICULUM_ID_ALLOWLIST;
  scanAllText(value, '', violations);
  validateIds(value, '', allowlist, violations);

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    validateScenarioShape(value as Record<string, unknown>, '', violations);
  }

  if (
    options.requireTrainingLabel &&
    (!value ||
      typeof value !== 'object' ||
      (value as Record<string, unknown>).trainingLabel !== 'TRAINING SIMULATION')
  ) {
    addViolation(
      violations,
      'missing_training_label',
      'trainingLabel',
      'Displayed scenario content must carry TRAINING SIMULATION.',
    );
  }

  return { safe: violations.length === 0, violations };
};

export const validateScenarioSafety = (scenario: unknown): SafetyValidationResult =>
  validateCurriculumSafety(scenario, { requireTrainingLabel: true });

export const validateScenario = validateScenarioSafety;
export const validateSafeContent = validateCurriculumSafety;
export const validateSafety = validateCurriculumSafety;

export const assertSafeCurriculumContent = (
  value: unknown,
  options?: SafetyValidatorOptions,
): void => {
  const result = validateCurriculumSafety(value, options);
  if (!result.safe) {
    const summary = result.violations
      .map((violation) => `${violation.code} at ${violation.path}`)
      .join(', ');
    throw new Error(`Unsafe curriculum content rejected: ${summary}`);
  }
};
