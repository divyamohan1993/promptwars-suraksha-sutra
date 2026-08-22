import { randomUUID } from 'node:crypto';

import type {
  ConstitutionRecord,
  HouseholdRecord,
  LearnerState,
  ProfileRecord,
} from '@suraksha-sutra/contracts';
import { conceptCatalogForSeed, unassessedState } from './policy';
import { profileScenarioMap } from '@surakshasutra/curriculum';

import type { HouseholdBundle, PersistedProfile } from '../data/data.types';

const profileSeedData = [
  {
    profileId: 'profile-savita',
    displayName: 'सविता',
    ageBand: '56_plus' as const,
    interfaceMode: 'standard' as const,
    preferredLanguage: 'hi' as const,
    preferredLanguages: ['hi'] as const,
    relevantContexts: ['pension', 'messaging', 'upi'] as const,
    goal: 'पेंशन और भुगतान अनुरोधों को सुरक्षित ढंग से पहचानना',
  },
  {
    profileId: 'profile-arjun',
    displayName: 'Arjun',
    ageBand: '13_17' as const,
    interfaceMode: 'fast_interactive' as const,
    preferredLanguage: 'hinglish' as const,
    preferredLanguages: ['hinglish', 'en'] as const,
    relevantContexts: ['internship', 'gaming', 'online_shopping'] as const,
    goal: 'Gaming, jobs और shopping में सुरक्षित निर्णय लेना',
  },
  {
    profileId: 'profile-ramesh',
    displayName: 'रमेश',
    ageBand: '35_55' as const,
    interfaceMode: 'transaction_focused' as const,
    preferredLanguage: 'hi_en' as const,
    preferredLanguages: ['hi_en', 'en'] as const,
    relevantContexts: ['small_business', 'qr_payments', 'customer_support'] as const,
    goal: 'दुकान और support requests में payment direction जाँचना',
  },
] as const;

export function createSeedBundle(
  subjectId: string,
  now = new Date().toISOString(),
): HouseholdBundle {
  const householdId = `household-${randomUUID()}`;
  const profiles: Record<string, PersistedProfile> = {};
  for (const seed of profileSeedData) {
    const record: ProfileRecord = {
      profileId: seed.profileId,
      householdId,
      displayName: seed.displayName,
      ageBand: seed.ageBand,
      interfaceMode: seed.interfaceMode,
      preferredLanguage: seed.preferredLanguage,
      status: 'active',
      constitutionVersion: 1,
      seededLabel: 'Seeded starting state',
      createdAt: now,
      updatedAt: now,
    };
    const constitution: ConstitutionRecord = {
      constitutionId: `constitution-${randomUUID()}`,
      profileId: seed.profileId,
      version: 1,
      goal: seed.goal,
      deadline: null,
      sessionMinutes: 7,
      interfaceMode: seed.interfaceMode,
      preferredLanguages: [...seed.preferredLanguages],
      readingComplexity: seed.profileId === 'profile-savita' ? 'simple' : 'standard',
      explanationDepth: seed.profileId === 'profile-savita' ? 'conceptual' : 'deep',
      challengePreference: seed.profileId === 'profile-arjun' ? 'moderate' : 'gentle',
      relevantContexts: [...seed.relevantContexts],
      allowVoiceProcessing: false,
      allowCrossSessionPersonalization: true,
      allowReminderNotifications: false,
      personalizationSignals: {
        correctness: true,
        confidence: true,
        responseTime: true,
        hintUse: true,
        teachBack: true,
        transfer: true,
      },
      accessibility: {
        keyboardOnly: false,
        reducedMotion: false,
        captions: true,
        textSize: seed.profileId === 'profile-savita' ? 'large' : 'medium',
        highContrast: false,
        screenReaderOptimized: false,
      },
      updatedAt: now,
    };
    const states: Record<string, LearnerState> = {};
    for (const concept of conceptCatalogForSeed()) {
      states[concept.conceptId] = unassessedState(seed.profileId, concept.conceptId);
    }
    const scenarioIds = profileScenarioMap[seed.profileId];
    profiles[seed.profileId] = {
      record,
      constitution,
      scenarioIds: [...scenarioIds],
      currentScenarioId: 'scenario-payment-001',
      currentTransferScenarioId: scenarioIds[0] ?? null,
      states,
      misconceptions: [],
      reviews: [],
      events: [],
      evidence: [],
      recommendation: null,
      scaffold: null,
      selectedRoute: null,
      selectedScaffoldLevel: 1,
      updatedAt: now,
    };
  }
  const household: HouseholdRecord = {
    householdId,
    displayName: 'SurakshaSutra evaluator household',
    ownerSubjectId: subjectId,
    status: 'active',
    profileIds: profileSeedData.map((profile) => profile.profileId),
    seededLabel: 'Evaluator test account',
    createdAt: now,
    updatedAt: now,
  };
  return {
    record: household,
    selectedProfileId: 'profile-savita',
    profiles,
    updatedAt: now,
  };
}

export function isSeedBundle(bundle: HouseholdBundle | null): bundle is HouseholdBundle {
  return Boolean(
    bundle &&
    bundle.record.profileIds.length === 3 &&
    bundle.record.profileIds.includes('profile-savita') &&
    bundle.record.profileIds.includes('profile-arjun') &&
    bundle.record.profileIds.includes('profile-ramesh') &&
    Object.keys(bundle.profiles).length === 3,
  );
}
