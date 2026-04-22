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
exports.TestCaseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const llm_service_1 = require("../llm/llm.service");
let TestCaseService = class TestCaseService {
    constructor(prisma, llmService) {
        this.prisma = prisma;
        this.llmService = llmService;
    }
    async createTestCase(createTestCaseDto) {
        const testPlan = await this.prisma.testPlan.findUnique({
            where: { id: createTestCaseDto.testPlanId },
        });
        if (!testPlan) {
            throw new common_1.NotFoundException('Test plan not found');
        }
        const testCase = await this.prisma.testCase.create({
            data: {
                testPlanId: createTestCaseDto.testPlanId,
                caseId: createTestCaseDto.caseId,
                title: createTestCaseDto.title,
                preconditions: JSON.stringify(createTestCaseDto.preconditions),
                steps: JSON.stringify(createTestCaseDto.steps),
                postconditions: JSON.stringify(createTestCaseDto.postconditions),
                priority: createTestCaseDto.priority,
                status: createTestCaseDto.status || 'draft',
            },
        });
        return {
            ...testCase,
            preconditions: JSON.parse(testCase.preconditions),
            steps: JSON.parse(testCase.steps),
            postconditions: JSON.parse(testCase.postconditions),
        };
    }
    async getAllTestCases() {
        const testCases = await this.prisma.testCase.findMany({
            include: {
                testPlan: {
                    select: { name: true, jiraIssueId: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        return testCases.map(testCase => ({
            ...testCase,
            preconditions: JSON.parse(testCase.preconditions),
            steps: JSON.parse(testCase.steps),
            postconditions: JSON.parse(testCase.postconditions),
        }));
    }
    async getTestCase(id) {
        const testCase = await this.prisma.testCase.findUnique({
            where: { id },
            include: {
                testPlan: {
                    select: { name: true, jiraIssueId: true }
                }
            },
        });
        if (!testCase) {
            throw new common_1.NotFoundException('Test case not found');
        }
        return {
            ...testCase,
            preconditions: JSON.parse(testCase.preconditions),
            steps: JSON.parse(testCase.steps),
            postconditions: JSON.parse(testCase.postconditions),
        };
    }
    async updateTestCase(id, updateTestCaseDto) {
        const existingTestCase = await this.prisma.testCase.findUnique({
            where: { id },
        });
        if (!existingTestCase) {
            throw new common_1.NotFoundException('Test case not found');
        }
        const updateData = { ...updateTestCaseDto };
        if (updateTestCaseDto.preconditions) {
            updateData.preconditions = JSON.stringify(updateTestCaseDto.preconditions);
        }
        if (updateTestCaseDto.steps) {
            updateData.steps = JSON.stringify(updateTestCaseDto.steps);
        }
        if (updateTestCaseDto.postconditions) {
            updateData.postconditions = JSON.stringify(updateTestCaseDto.postconditions);
        }
        const testCase = await this.prisma.testCase.update({
            where: { id },
            data: updateData,
        });
        return {
            ...testCase,
            preconditions: JSON.parse(testCase.preconditions),
            steps: JSON.parse(testCase.steps),
            postconditions: JSON.parse(testCase.postconditions),
        };
    }
    async deleteTestCase(id) {
        const testCase = await this.prisma.testCase.findUnique({
            where: { id },
        });
        if (!testCase) {
            throw new common_1.NotFoundException('Test case not found');
        }
        await this.prisma.testCase.delete({
            where: { id },
        });
        return { message: 'Test case deleted successfully' };
    }
    async generateTestCases(generateTestCasesDto) {
        const { testPlanId, llmConfigId, additionalInstructions } = generateTestCasesDto;
        const testPlan = await this.prisma.testPlan.findUnique({
            where: { id: testPlanId },
        });
        if (!testPlan) {
            throw new common_1.NotFoundException('Test plan not found');
        }
        const testPlanContent = JSON.parse(testPlan.content);
        const prompt = `Generate a set of detailed test cases derived from the following Test Plan:
Name: ${testPlanContent.name}
Description: ${testPlanContent.description}
Strategy: ${testPlanContent.strategy}
Scope: In Scope - ${testPlanContent.scope?.inScope?.join(', ')}

${additionalInstructions ? `Additional Guidelines: \n${additionalInstructions}` : ''}

Format the output strictly as a JSON array where each object has these exact keys:
"title" (string), "caseId" (string like TC-001), "preconditions" (array of strings), "steps" (array of objects with "action" and "expectedResult" schema keys), "postconditions" (array of strings), "priority" (string: low, medium, high, critical).`;
        const result = await this.llmService.generateText(llmConfigId, prompt);
        if (!result.success || !result.text) {
            throw new Error(`Failed to generate test cases: ${result.error}`);
        }
        let casesPayload = [];
        try {
            const match = result.text.match(/```json\n([\s\S]*?)\n```/) || result.text.match(/```([\s\S]*?)\n```/);
            const jsonString = match ? match[1].trim() : result.text.trim();
            casesPayload = JSON.parse(jsonString);
        }
        catch (e) {
            throw new Error(`Failed to parse LLM response into array of test cases. Raw output: ${result.text.substring(0, 100)}...`);
        }
        const savedCases = [];
        for (const testCase of casesPayload) {
            const saved = await this.prisma.testCase.create({
                data: {
                    testPlanId,
                    caseId: testCase.caseId || `TC-${Date.now().toString().slice(-4)}`,
                    title: testCase.title,
                    preconditions: JSON.stringify(testCase.preconditions || []),
                    steps: JSON.stringify(testCase.steps || []),
                    postconditions: JSON.stringify(testCase.postconditions || []),
                    priority: testCase.priority?.toLowerCase() || 'medium',
                    status: 'draft',
                },
            });
            savedCases.push({
                ...saved,
                preconditions: JSON.parse(saved.preconditions),
                steps: JSON.parse(saved.steps),
                postconditions: JSON.parse(saved.postconditions),
            });
        }
        return {
            success: true,
            message: `Generated and saved ${savedCases.length} test cases.`,
            testCases: savedCases,
        };
    }
};
exports.TestCaseService = TestCaseService;
exports.TestCaseService = TestCaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LlmService])
], TestCaseService);
//# sourceMappingURL=test-case.service.js.map