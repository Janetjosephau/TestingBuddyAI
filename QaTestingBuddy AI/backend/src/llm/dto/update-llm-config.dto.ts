import { IsEnum, IsString, IsOptional, IsNumber, IsUrl, Min, Max, Length } from 'class-validator';

export class UpdateLlmConfigDto {
  @IsOptional()
  @IsEnum(['openai', 'gemini', 'ollama', 'lmstudio', 'grok'])
  provider?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  apiKey?: string;

  @IsOptional()
  @IsUrl()
  apiUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(32768)
  maxTokens?: number;
}
