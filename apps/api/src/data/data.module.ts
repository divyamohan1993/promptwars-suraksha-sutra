import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { getRuntimeEnvironment, type RuntimeEnvironment } from '../config/runtime-environment';
import { FirebaseAdminService } from '../auth/firebase-admin.service';
import { FirestoreRepository } from './firestore.repository';
import { InMemoryRepository } from './memory.repository';
import { DATA_REPOSITORY } from './repository.token';

@Module({
  providers: [
    InMemoryRepository,
    {
      provide: DATA_REPOSITORY,
      inject: [FirebaseAdminService, ConfigService],
      useFactory: (firebase: FirebaseAdminService, config: ConfigService<RuntimeEnvironment>) => {
        const environment = getRuntimeEnvironment(config);
        if (environment.TEST_AUTH_MODE || !firebase.getFirestore()) {
          return new InMemoryRepository();
        }
        return new FirestoreRepository(firebase.getFirestore()!);
      },
    },
  ],
  exports: [DATA_REPOSITORY],
})
export class DataModule {}
