import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fallbackExplanation,
  fallbackTeachBack,
  fallbackSentence,
  profileCopy,
  requiredCopyKeys,
  uiCopy,
} from '../src/index.js';

test('every bilingual UI language has every required non-empty copy key', () => {
  for (const [language, copy] of Object.entries(uiCopy)) {
    for (const key of requiredCopyKeys) {
      assert.equal(typeof copy[key], 'string', `${language}.${key} is not a string`);
      assert.ok(copy[key].trim().length > 0, `${language}.${key} is empty`);
    }
  }
});

test('required demo profiles use their approved language adaptations', () => {
  assert.match(profileCopy['profile-savita'].diagnosticHeading, /[\u0900-\u097F]/u);
  assert.match(profileCopy['profile-arjun'].diagnosticHeading, /[A-Za-z]/u);
  assert.match(profileCopy['profile-ramesh'].diagnosticHeading, /[\u0900-\u097F]/u);
  assert.match(profileCopy['profile-ramesh'].diagnosticHeading, /[A-Za-z]/u);
});

test('fallback label is truthful and exact', () => {
  assert.equal(
    fallbackSentence,
    'Curated fallback used because the live model was unavailable or its output was rejected.',
  );
  assert.equal(uiCopy.en.fallbackSentence, fallbackSentence);
  assert.equal(fallbackExplanation.displayLabel, fallbackSentence);
  assert.equal(fallbackTeachBack.displayLabel, fallbackSentence);
});
