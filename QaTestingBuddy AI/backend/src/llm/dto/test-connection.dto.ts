import { IsEnum, IsString, IsOptional, IsNumber, IsUrl, Min, Max } from 'class-validator';

export class TestConnectionDto {
  @IsEnum(['ollama'])
  provider: string;

  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsUrl()
  apiUrl?: string;

  @IsString()
  model: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;
}