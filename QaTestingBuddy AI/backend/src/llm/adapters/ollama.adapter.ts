import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { LLMAdapter, LLMConfig } from './llm-adapter.interface';

@Injectable()
export class OllamaAdapter implements LLMAdapter {
  private baseUrl = 'http://localhost:11434';

  async testConnection(config: LLMConfig): Promise<{ success: boolean; error?: string; models?: string[] }> {
    try {
      const url = config.apiUrl?.replace(/\/$/, '') || this.baseUrl;
      const response = await axios.get(`${url}/api/tags`, {
        timeout: 10000,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.data && response.data.models) {
        const models = response.data.models.map((model: any) => model.name);
        return { success: true, models };
      } else {
        return { success: false, error: 'Unexpected response format' };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Connection failed'
      };
    }
  }

  async generateText(prompt: string, config: LLMConfig): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      const payload = {
        model: config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: config.temperature || 0.7,
          num_predict: config.maxTokens || 2048,
        },
      };

      const url = config.apiUrl?.replace(/\/$/, '') || this.baseUrl;
      const response = await axios.post(`${url}/api/generate`, payload, {
        timeout: 300000, // 5 minutes for slow local models
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.data && response.data.response) {
        return { success: true, text: response.data.response };
      } else {
        return { success: false, error: 'No response generated' };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Generation failed'
      };
    }
  }
}