import { Injectable } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';

import type { DataRepository, HouseholdBundle, PersistedProfile } from './data.types';

const householdsCollection = 'suraksha_households';
const profilesCollection = 'profiles';

@Injectable()
export class FirestoreRepository implements DataRepository {
  public constructor(private readonly firestore: Firestore) {}

  public async findHouseholdForSubject(subjectId: string): Promise<HouseholdBundle | null> {
    const snapshot = await this.firestore
      .collection(householdsCollection)
      .where('ownerSubjectId', '==', subjectId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    const document = snapshot.docs[0];
    return document ? this.readBundle(document.id, document.data()) : null;
  }

  public async getHousehold(householdId: string): Promise<HouseholdBundle | null> {
    const document = await this.firestore.collection(householdsCollection).doc(householdId).get();
    return document.exists ? this.readBundle(document.id, document.data() ?? {}) : null;
  }

  public async getProfile(
    householdId: string,
    profileId: string,
  ): Promise<PersistedProfile | null> {
    const document = await this.profileReference(householdId, profileId).get();
    return document.exists ? (document.data() as PersistedProfile) : null;
  }

  public async saveBundle(bundle: HouseholdBundle): Promise<void> {
    await this.firestore.runTransaction(async (transaction) => {
      const householdRef = this.firestore
        .collection(householdsCollection)
        .doc(bundle.record.householdId);
      transaction.set(householdRef, {
        ...bundle.record,
        selectedProfileId: bundle.selectedProfileId,
        updatedAt: bundle.updatedAt,
      });
      for (const profile of Object.values(bundle.profiles)) {
        transaction.set(
          householdRef.collection(profilesCollection).doc(profile.record.profileId),
          profile,
        );
      }
    });
  }

  public async saveProfile(householdId: string, profile: PersistedProfile): Promise<void> {
    const householdRef = this.firestore.collection(householdsCollection).doc(householdId);
    await this.firestore.runTransaction(async (transaction) => {
      const household = await transaction.get(householdRef);
      if (!household.exists) throw new Error('Household does not exist.');
      transaction.set(
        householdRef.collection(profilesCollection).doc(profile.record.profileId),
        profile,
      );
      transaction.update(householdRef, { updatedAt: profile.updatedAt });
    });
  }

  public async resetSubject(subjectId: string, bundle: HouseholdBundle): Promise<void> {
    const existing = await this.findHouseholdForSubject(subjectId);
    if (existing && existing.record.householdId !== bundle.record.householdId) {
      await this.firestore
        .collection(householdsCollection)
        .doc(existing.record.householdId)
        .update({
          status: 'deleted',
          updatedAt: bundle.updatedAt,
        });
    }
    await this.saveBundle(bundle);
  }

  private profileReference(householdId: string, profileId: string) {
    return this.firestore
      .collection(householdsCollection)
      .doc(householdId)
      .collection(profilesCollection)
      .doc(profileId);
  }

  private async readBundle(
    householdId: string,
    householdData: Record<string, unknown>,
  ): Promise<HouseholdBundle> {
    const snapshot = await this.firestore
      .collection(householdsCollection)
      .doc(householdId)
      .collection(profilesCollection)
      .get();
    const profiles: Record<string, PersistedProfile> = {};
    for (const document of snapshot.docs)
      profiles[document.id] = document.data() as PersistedProfile;
    return {
      record: householdData as HouseholdBundle['record'],
      selectedProfileId:
        typeof householdData['selectedProfileId'] === 'string'
          ? householdData['selectedProfileId']
          : (Object.keys(profiles)[0] ?? ''),
      profiles,
      updatedAt:
        typeof householdData['updatedAt'] === 'string'
          ? householdData['updatedAt']
          : new Date().toISOString(),
    };
  }
}
