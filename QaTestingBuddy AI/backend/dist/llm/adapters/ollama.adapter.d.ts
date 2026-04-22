import { LLMAdapter, LLMConfig } from './llm-adapter.interface';
export declare class OllamaAdapter implements LLMAdapter {
    private baseUrl;
    testConnection(config: LLMConfig): Promise<{
        success: boolean;
        error?: string;
        models?: string[];
    }>;
    generateText(prompt: string, config: LLMConfig): Promise<{
        success: boolean;
        text?: string;
        error?: string;
    }>;
}
