import { LlmService } from './llm.service';
import { TestConnectionDto } from './dto/test-connection.dto';
import { CreateLlmConfigDto } from './dto/create-llm-config.dto';
import { UpdateLlmConfigDto } from './dto/update-llm-config.dto';
export declare class LlmController {
    private readonly llmService;
    constructor(llmService: LlmService);
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
}
