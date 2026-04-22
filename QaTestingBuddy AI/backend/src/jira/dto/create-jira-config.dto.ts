import { IsString, IsEmail, Length } from 'class-validator';

export class CreateJiraConfigDto {
  @IsString()
  @Length(1, 200)
  instanceUrl: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(1, 500)
  apiToken: string;

  @IsString()
  @Length(1, 50)
  projectKey: string;
}
