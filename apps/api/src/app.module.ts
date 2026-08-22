import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateRuntimeEnvironment } from './config/runtime-environment';
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
    HealthModule,
  ],
})
export class AppModule {}
