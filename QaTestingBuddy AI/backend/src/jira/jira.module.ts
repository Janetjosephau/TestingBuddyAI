import { Module } from '@nestjs/common';
import { JiraController } from './jira.controller';
import { JiraService } from './jira.service';
// import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [], // DatabaseModule commented out for mock implementations
  controllers: [JiraController],
  providers: [JiraService],
  exports: [JiraService],
})
export class JiraModule {}