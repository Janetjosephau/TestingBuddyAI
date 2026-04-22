import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LlmAdapterFactory } from './adapters/llm-adapter.factory';
import { TestConnectionDto } from './dto/test-connection.dto';
import { CreateLlmConfigDto } from './dto/create-llm-config.dto';
import { UpdateLlmConfigDto } from './dto/update-llm-config.dto';

@Injectable()
export class LlmService {
  constructor(
    // private readonly prisma: PrismaService, // Commented out for mock implementation
    private readonly adapterFactory: LlmAdapterFactory,
  ) {}

  private getMockLlmConfigs() {
    return [
      {
        id: 'llm-1',
        provider: 'openai',
        name: 'OpenAI GPT-4',
        apiKey: 'encrypted-key-123',
        apiUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        testStatus: 'connected',
        lastTestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'llm-2',
        provider: 'ollama',
        name: 'Local Ollama',
        apiKey: '',
        apiUrl: 'http://localhost:11434',
        model: 'llama2',
        temperature: 0.7,
        maxTokens: 2000,
        testStatus: 'connected',
        lastTestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

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
    // Mock implementation - simulate connection test and create config
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

    // Create mock config
    const newConfig = {
      id: `llm-${Date.now()}`,
      provider: createLlmConfigDto.provider,
      name: createLlmConfigDto.name,
      apiKey: this.maskApiKey(createLlmConfigDto.apiKey || ''),
      apiUrl: createLlmConfigDto.apiUrl,
      model: createLlmConfigDto.model,
      temperature: createLlmConfigDto.temperature,
      maxTokens: createLlmConfigDto.maxTokens,
      testStatus: 'connected',
      lastTestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return newConfig;
  }

  async getAllConfigs() {
    // Mock implementation - return mock configs
    const mockConfigs = this.getMockLlmConfigs();
    return mockConfigs.map(config => ({
      ...config,
      apiKey: this.maskApiKey(config.apiKey),
    }));
  }

  async getConfig(id: string) {
    // Mock implementation - find config by id
    const mockConfigs = this.getMockLlmConfigs();
    const config = mockConfigs.find(c => c.id === id);

    if (!config) {
      throw new NotFoundException('LLM configuration not found');
    }

    return {
      ...config,
      apiKey: this.maskApiKey(config.apiKey),
    };
  }

  async updateConfig(id: string, updateLlmConfigDto: UpdateLlmConfigDto) {
    // Mock implementation - find and update config
    const mockConfigs = this.getMockLlmConfigs();
    const existingConfig = mockConfigs.find(c => c.id === id);

    if (!existingConfig) {
      throw new NotFoundException('LLM configuration not found');
    }

    // If updating credentials, test connection first
    if (updateLlmConfigDto.apiKey || updateLlmConfigDto.apiUrl || updateLlmConfigDto.model) {
      const testData = {
        provider: updateLlmConfigDto.provider ?? existingConfig.provider,
        apiKey: updateLlmConfigDto.apiKey ?? existingConfig.apiKey,
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

    // Update the config
    const updatedConfig = {
      ...existingConfig,
      ...updateLlmConfigDto,
      apiKey: updateLlmConfigDto.apiKey ? this.maskApiKey(updateLlmConfigDto.apiKey) : existingConfig.apiKey,
      testStatus: 'connected',
      lastTestedAt: new Date(),
      updatedAt: new Date()
    };

    return updatedConfig;
  }

  async deleteConfig(id: string) {
    // Mock implementation - check if config exists
    const mockConfigs = this.getMockLlmConfigs();
    const exists = mockConfigs.some(c => c.id === id);
    if (!exists) throw new NotFoundException('LLM configuration not found');

    // In a real implementation, this would check for dependencies and delete
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
    // Mock implementation - find config and simulate generation
    const mockConfigs = this.getMockLlmConfigs();
    const config = mockConfigs.find(c => c.id === id);

    if (!config) {
      throw new NotFoundException('LLM configuration not found');
    }

    // Mock LLM response - in a real implementation, this would call the adapter
    const mockResponse = {
      success: true,
      text: `Mock LLM response for prompt: ${prompt.substring(0, 50)}...`,
      usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 }
    };

    return mockResponse;
  }
}