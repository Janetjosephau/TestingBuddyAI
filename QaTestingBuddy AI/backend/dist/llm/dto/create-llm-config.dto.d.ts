export declare class CreateLlmConfigDto {
    provider: string;
    name: string;
    apiKey: string;
    apiUrl?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
}
