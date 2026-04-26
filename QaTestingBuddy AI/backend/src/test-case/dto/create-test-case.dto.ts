import { IsString, IsArray, IsEnum, IsOptional } from 'class-validator';

export class CreateTestCaseDto {
  @IsString()
  testPlanId: string;

  @IsString()
  caseId: string;

  @IsString()
  title: string;

  @IsArray()
  @IsString({ each: true })
  preconditions: string[];

  @IsArray()
  steps: Array<{
    action: string;
    expectedResult: string;
  }>;

  @IsArray()
  @IsString({ each: true })
  postconditions: string[];

  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority: string;

  @IsOptional()
  @IsEnum(['draft', 'selected', 'synced_to_rally'])
  status?: string;

  @IsOptional()
  @IsString()
  testData?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  automationTags?: string[];
}