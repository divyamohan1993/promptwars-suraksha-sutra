import { Injectable } from '@nestjs/common';

import type { DataRepository, HouseholdBundle, PersistedProfile } from './data.types';

@Injectable()
export class InMemoryRepository implements DataRepository {
  private readonly households = new Map<string, HouseholdBundle>();

  public async findHouseholdForSubject(subjectId: string): Promise<HouseholdBundle | null> {
    for (const bundle of this.households.values()) {
      if (bundle.record.ownerSubjectId === subjectId && bundle.record.status === 'active') {
        return clone(bundle);
      }
    }
    return null;
  }

  public async getHousehold(householdId: string): Promise<HouseholdBundle | null> {
    const bundle = this.households.get(householdId);
    return bundle ? clone(bundle) : null;
  }

  public async getProfile(
    householdId: string,
    profileId: string,
  ): Promise<PersistedProfile | null> {
    const bundle = this.households.get(householdId);
    const profile = bundle?.profiles[profileId];
    return profile ? clone(profile) : null;
  }

  public async saveBundle(bundle: HouseholdBundle): Promise<void> {
    this.households.set(bundle.record.householdId, clone(bundle));
  }

  public async saveProfile(householdId: string, profile: PersistedProfile): Promise<void> {
    const bundle = this.households.get(householdId);
    if (!bundle) throw new Error('Household does not exist.');
    this.households.set(
      householdId,
      clone({
        ...bundle,
        selectedProfileId: bundle.selectedProfileId,
        profiles: { ...bundle.profiles, [profile.record.profileId]: profile },
        updatedAt: profile.updatedAt,
      }),
    );
  }

  public async resetSubject(subjectId: string, bundle: HouseholdBundle): Promise<void> {
    for (const [id, current] of this.households) {
      if (current.record.ownerSubjectId === subjectId) this.households.delete(id);
    }
    await this.saveBundle(bundle);
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
