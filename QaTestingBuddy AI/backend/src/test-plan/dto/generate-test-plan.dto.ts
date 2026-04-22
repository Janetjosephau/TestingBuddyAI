import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class GenerateTestPlanDto {
  @IsString()
  jiraIssueId: string;

  @IsString()
  jiraRequirement: string; // JSON string of the Jira requirement

  @IsString()
  llmConfigId: string;

  @IsOptional()
  @IsString()
  jiraConfigId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalRequirements?: string[];

  @IsOptional()
  @IsEnum(['pdf', 'json'])
  exportFormat?: string;
}