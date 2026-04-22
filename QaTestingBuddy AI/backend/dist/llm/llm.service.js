"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const llm_adapter_factory_1 = require("./adapters/llm-adapter.factory");
let LlmService = class LlmService {
    constructor(prisma, adapterFactory) {
        this.prisma = prisma;
        this.adapterFactory = adapterFactory;
    }
    async testConnection(testConnectionDto) {
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
    async createConfig(createLlmConfigDto) {
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
            apiKey: this.maskApiKey(config.apiKey),
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
    async getConfig(id) {
        const config = await this.prisma.lLMConfig.findUnique({
            where: { id },
        });
        if (!config) {
            throw new common_1.NotFoundException('LLM configuration not found');
        }
        return {
            ...config,
            apiKey: this.maskApiKey(config.apiKey),
        };
    }
    async updateConfig(id, updateLlmConfigDto) {
        const existingConfig = await this.prisma.lLMConfig.findUnique({
            where: { id },
        });
        if (!existingConfig) {
            throw new common_1.NotFoundException('LLM configuration not found');
        }
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
        const updateData = { ...updateLlmConfigDto };
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
    async deleteConfig(id) {
        const config = await this.prisma.lLMConfig.findUnique({
            where: { id },
        });
        if (!config) {
            throw new common_1.NotFoundException('LLM configuration not found');
        }
        const testPlansCount = await this.prisma.testPlan.count({
            where: { generatedBy: id },
        });
        if (testPlansCount > 0) {
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
    encryptApiKey(apiKey) {
        return Buffer.from(apiKey).toString('base64');
    }
    decryptApiKey(encryptedApiKey) {
        return Buffer.from(encryptedApiKey, 'base64').toString();
    }
    maskApiKey(apiKey) {
        if (apiKey.length <= 8)
            return '*'.repeat(apiKey.length);
        return apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
    }
    async generateText(id, prompt) {
        const config = await this.prisma.lLMConfig.findUnique({
            where: { id },
        });
        if (!config) {
            throw new common_1.NotFoundException('LLM configuration not found');
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
};
exports.LlmService = LlmService;
exports.LlmService = LlmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_adapter_factory_1.LlmAdapterFactory])
], LlmService);
//# sourceMappingURL=llm.service.js.map