import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LlmAdapterFactory } from './adapters/llm-adapter.factory';
import { TestConnectionDto } from './dto/test-connection.dto';
import { CreateLlmConfigDto } from './dto/create-llm-config.dto';
import { UpdateLlmConfigDto } from './dto/update-llm-config.dto';

@Injectable()
export class LlmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapterFactory: LlmAdapterFactory,
  ) {}

  async testConnection(testConnectionDto: TestConnectionDto) {
    const adapter = this.adapterFactory.getAdapter(testConnectionDto.provider);

    const result = await adapter.testConnection(testConnectionDto);

    return {
      status: result.success ? 'connected' : 'failed',
      provider: testConnectionDto.provider,
      model: testConnectionDto.model,
      message: result.success ? 'Connection Successful' : `Connection Failed: ${result.error}`,
      availableModels: result.models,
      timestamp: new Date().toISOString(),
    };
  }

  async createConfig(createLlmConfigDto: CreateLlmConfigDto) {
    // Test connection first
    const testResult = await this.testConnection({
      provider: createLlmConfigDto.provider,
      apiKey: createLlmConfigDto.apiKey,
      apiUrl: createLlmConfigDto.apiUrl,
      model: createLlmConfigDto.model,
      temperature: createLlmConfigDto.temperature,
      maxTokens: createLlmConfigDto.maxTokens,
    });

    if (testResult.status !== 'connected') {
      throw new Error(`Cannot save config: ${testResult.message}`);
    }

    // Encrypt API key (basic encryption for now - in production use proper encryption)
    const encryptedApiKey = this.encryptApiKey(createLlmConfigDto.apiKey);

    const config = await this.prisma.lLMConfig.create({
      data: {
        provider: createLlmConfigDto.provider,
        name: createLlmConfigDto.name,
        apiKey: encryptedApiKey,
        apiUrl: createLlmConfigDto.apiUrl,
        model: createLlmConfigDto.model,
        temperature: createLlmConfigDto.temperature,
        maxTokens: createLlmConfigDto.maxTokens,
        testStatus: 'connected',
        lastTestedAt: new Date(),
      },
    });

    return {
      ...config,
      apiKey: this.maskApiKey(config.apiKey), // Don't return actual key
    };
  }

  async getAllConfigs() {
    const configs = await this.prisma.lLMConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return configs.map(config => ({
      ...config,
      apiKey: this.maskApiKey(config.apiKey),
    }));
  }

  async getConfig(id: string) {
    const config = await this.prisma.lLMConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('LLM configuration not found');
    }

    return {
      ...config,
      apiKey: this.maskApiKey(config.apiKey),
    };
  }

  async updateConfig(id: string, updateLlmConfigDto: UpdateLlmConfigDto) {
    const existingConfig = await this.prisma.lLMConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw new NotFoundException('LLM configuration not found');
    }

    // If updating credentials, test connection first
    if (updateLlmConfigDto.apiKey || updateLlmConfigDto.apiUrl || updateLlmConfigDto.model) {
      const testData = {
        provider: updateLlmConfigDto.provider ?? existingConfig.provider,
        apiKey: updateLlmConfigDto.apiKey ?? this.decryptApiKey(existingConfig.apiKey),
        apiUrl: updateLlmConfigDto.apiUrl ?? existingConfig.apiUrl,
        model: updateLlmConfigDto.model ?? existingConfig.model,
        temperature: updateLlmConfigDto.temperature ?? existingConfig.temperature,
        maxTokens: updateLlmConfigDto.maxTokens ?? existingConfig.maxTokens,
      };

      const testResult = await this.testConnection(testData);

      if (testResult.status !== 'connected') {
        throw new Error(`Cannot update config: ${testResult.message}`);
      }
    }

    const updateData: any = { ...updateLlmConfigDto };

    if (updateLlmConfigDto.apiKey) {
      updateData.apiKey = this.encryptApiKey(updateLlmConfigDto.apiKey);
    }

    if (updateLlmConfigDto.apiKey || updateLlmConfigDto.apiUrl || updateLlmConfigDto.model) {
      updateData.testStatus = 'connected';
      updateData.lastTestedAt = new Date();
    }

    const config = await this.prisma.lLMConfig.update({
      where: { id },
      data: updateData,
    });

    return {
      ...config,
      apiKey: this.maskApiKey(config.apiKey),
    };
  }

  async deleteConfig(id: string) {
    const config = await this.prisma.lLMConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('LLM configuration not found');
    }

    // Check if config is being used by any test plans
    const testPlansCount = await this.prisma.testPlan.count({
      where: { generatedBy: id },
    });

    if (testPlansCount > 0) {
      // Mark test plans as having missing config instead of deleting
      await this.prisma.testPlan.updateMany({
        where: { generatedBy: id },
        data: { status: 'config_missing' },
      });
    }

    await this.prisma.lLMConfig.delete({
      where: { id },
    });

    return { message: 'LLM configuration deleted successfully' };
  }

  private encryptApiKey(apiKey: string): string {
    // Basic encryption - in production use proper encryption library
    return Buffer.from(apiKey).toString('base64');
  }

  private decryptApiKey(encryptedApiKey: string): string {
    // Basic decryption - in production use proper encryption library
    return Buffer.from(encryptedApiKey, 'base64').toString();
  }

  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) return '*'.repeat(apiKey.length);
    return apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
  }

  async generateText(id: string, prompt: string) {
    const config = await this.prisma.lLMConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('LLM configuration not found');
    }

    const adapter = this.adapterFactory.getAdapter(config.provider);
    
    const llmConfig = {
      provider: config.provider,
      apiKey: this.decryptApiKey(config.apiKey),
      apiUrl: config.apiUrl,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    };

    return adapter.generateText(prompt, llmConfig);
  }
}