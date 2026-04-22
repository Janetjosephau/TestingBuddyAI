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
exports.TestPlanService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const llm_service_1 = require("../llm/llm.service");
let TestPlanService = class TestPlanService {
    constructor(prisma, llmService) {
        this.prisma = prisma;
        this.llmService = llmService;
    }
    async generateTestPlan(generateTestPlanDto) {
        const { jiraIssueId, jiraRequirement, llmConfigId, jiraConfigId, additionalRequirements, exportFormat } = generateTestPlanDto;
        const llmConfig = await this.prisma.lLMConfig.findUnique({
            where: { id: llmConfigId },
        });
        if (!llmConfig) {
            throw new common_1.NotFoundException('LLM configuration not found');
        }
        let requirement;
        try {
            requirement = JSON.parse(jiraRequirement);
        }
        catch (error) {
            throw new Error('Invalid Jira requirement format');
        }
        const prompt = this.buildTestPlanPrompt(requirement, additionalRequirements);
        const generationResult = await this.llmService.generateText(llmConfigId, prompt);
        let testPlanContent;
        if (!generationResult.success || !generationResult.text) {
            throw new Error(`Failed to generate test plan: ${generationResult.error}`);
        }
        try {
            const match = generationResult.text.match(/```json\n([\s\S]*?)\n```/) || generationResult.text.match(/```([\s\S]*?)\n```/);
            const jsonString = match ? match[1].trim() : generationResult.text.trim();
            testPlanContent = JSON.parse(jsonString);
            testPlanContent.name = testPlanContent.name || `Test Plan for ${requirement.key}: ${requirement.title}`;
            testPlanContent.description = testPlanContent.description || `Comprehensive test plan for ${requirement.key}`;
        }
        catch (e) {
            throw new Error(`Failed to parse LLM response into required JSON format. Raw output: ${generationResult.text.substring(0, 100)}...`);
        }
        const testPlanData = testPlanContent;
        const testPlan = await this.prisma.testPlan.create({
            data: {
                name: testPlanData.name,
                description: testPlanData.description,
                jiraIssueId,
                generatedBy: llmConfigId,
                jiraConfigId,
                content: JSON.stringify(testPlanData),
                exportFormat,
                status: 'draft',
            },
        });
        return {
            id: testPlan.id,
            ...testPlanData,
            generatedAt: testPlan.generatedAt,
            status: testPlan.status,
        };
    }
    async getAllTestPlans() {
        const testPlans = await this.prisma.testPlan.findMany({
            include: {
                testCases: true,
                llmConfig: {
                    select: { name: true, provider: true }
                }
            },
            orderBy: { generatedAt: 'desc' },
        });
        return testPlans.map(plan => ({
            ...plan,
            content: JSON.parse(plan.content),
        }));
    }
    async getTestPlan(id) {
        const testPlan = await this.prisma.testPlan.findUnique({
            where: { id },
            include: {
                testCases: true,
                llmConfig: {
                    select: { name: true, provider: true }
                }
            },
        });
        if (!testPlan) {
            throw new common_1.NotFoundException('Test plan not found');
        }
        return {
            ...testPlan,
            content: JSON.parse(testPlan.content),
        };
    }
    buildTestPlanPrompt(requirement, additionalRequirements) {
        return `Generate a comprehensive test plan for the following Jira requirement:

Title: ${requirement.title}
Description: ${requirement.description}
Issue Type: ${requirement.issueType}
Priority: ${requirement.priority}
Status: ${requirement.status}

${additionalRequirements ? `Additional Requirements:\n${additionalRequirements.join('\n')}` : ''}

Please generate a test plan with the following structure:
1. Objectives
2. Scope (In Scope / Out of Scope)
3. Test Strategy
4. Resources Required
5. Timeline
6. Exit Criteria

Format the response as a JSON object with these exact keys: objectives (array), scope (object with inScope and outOfScope arrays), strategy (string), resources (array), timeline (string), exitCriteria (array).`;
    }
};
exports.TestPlanService = TestPlanService;
exports.TestPlanService = TestPlanService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LlmService])
], TestPlanService);
//# sourceMappingURL=test-plan.service.js.map