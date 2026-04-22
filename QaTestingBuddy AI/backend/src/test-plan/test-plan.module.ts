import { Module } from '@nestjs/common';
import { TestPlanController } from './test-plan.controller';
import { TestPlanService } from './test-plan.service';

@Module({
  controllers: [TestPlanController],
  providers: [TestPlanService],
  exports: [TestPlanService],
})
export class TestPlanModule {}