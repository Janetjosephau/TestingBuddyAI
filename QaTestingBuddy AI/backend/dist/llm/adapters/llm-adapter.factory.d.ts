import { LLMAdapter } from './llm-adapter.interface';
import { OllamaAdapter } from './ollama.adapter';
export declare class LlmAdapterFactory {
    private readonly ollamaAdapter;
    constructor(ollamaAdapter: OllamaAdapter);
    getAdapter(provider: string): LLMAdapter;
}
