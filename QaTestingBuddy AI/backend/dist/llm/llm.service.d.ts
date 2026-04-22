import { PrismaService } from '../database/prisma.service';
import { LlmAdapterFactory } from './adapters/llm-adapter.factory';
import { TestConnectionDto } from './dto/test-connection.dto';
import { CreateLlmConfigDto } from './dto/create-llm-config.dto';
import { UpdateLlmConfigDto } from './dto/update-llm-config.dto';
export declare class LlmService {
    private readonly prisma;
    private readonly adapterFactory;
    constructor(prisma: PrismaService, adapterFactory: LlmAdapterFactory);
    testConnection(testConnectionDto: TestConnectionDto): Promise<{
        status: string;
        provider: string;
        model: string;
        message: string;
        availableModels: string[];
        timestamp: string;
    }>;
    createConfig(createLlmConfigDto: CreateLlmConfigDto): Promise<any>;
    getAllConfigs(): Promise<any>;
    getConfig(id: string): Promise<any>;
    updateConfig(id: string, updateLlmConfigDto: UpdateLlmConfigDto): Promise<any>;
    deleteConfig(id: string): Promise<{
        message: string;
    }>;
    private encryptApiKey;
    private decryptApiKey;
    private maskApiKey;
    generateText(id: string, prompt: string): Promise<{
        success: boolean;
        text?: string;
        error?: string;
    }>;
}
