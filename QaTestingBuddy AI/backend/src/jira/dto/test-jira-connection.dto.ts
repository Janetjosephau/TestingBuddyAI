import { IsString, IsUrl, Length } from 'class-validator';

export class TestJiraConnectionDto {
  @IsUrl()
  instanceUrl: string;

  @IsString()
  @Length(1, 255)
  email: string;

  @IsString()
  @Length(1, 255)
  apiToken: string;

  @IsString()
  @Length(1, 50)
  projectKey?: string;
}