import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateRuntimeEnvironment } from './config/runtime-environment';
import { RuntimeConfigController } from './config/config.controller';
import { AuthModule } from './auth/auth.module';
import { LearningModule } from './learning/learning.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      expandVariables: false,
      envFilePath: ['.env', '../../.env'],
      ignoreEnvFile: false,
      isGlobal: true,
      validate: validateRuntimeEnvironment,
    }),
    AuthModule,
    LearningModule,
    HealthModule,
  ],
  controllers: [RuntimeConfigController],
})
export class AppModule {}
