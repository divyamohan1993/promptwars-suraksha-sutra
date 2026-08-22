import { Module } from '@nestjs/common';

import { VertexGateway } from '../ai/vertex.gateway';
import { DataModule } from '../data/data.module';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';

@Module({
  imports: [DataModule],
  controllers: [LearningController],
  providers: [LearningService, VertexGateway],
  exports: [LearningService],
})
export class LearningModule {}
