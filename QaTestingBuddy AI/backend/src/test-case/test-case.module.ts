import { Module } from '@nestjs/common';
import { TestCaseController } from './test-case.controller';
import { TestCaseService } from './test-case.service';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [TestCaseController],
  providers: [TestCaseService],
  exports: [TestCaseService],
})
export class TestCaseModule {}