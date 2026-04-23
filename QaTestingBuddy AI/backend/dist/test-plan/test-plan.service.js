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
    getMockTestPlans() {
        return [
            {
                id: 'tp-1',
                name: 'Authentication Module Test Plan',
                description: 'Comprehensive test plan for user authentication features',
                jiraIssueId: 'AUTH-123',
                generatedBy: 'llm-1',
                jiraConfigId: 'jira-1',
                content: JSON.stringify({
                    name: 'Authentication Module Test Plan',
                    description: 'Comprehensive test plan for user authentication features',
                    objectives: ['Verify user login functionality', 'Test password reset flow', 'Validate session management'],
                    scope: {
                        inScope: ['Login page', 'Password reset', 'Session timeout'],
                        outOfScope: ['Third-party authentication', 'Admin features']
                    },
                    strategy: 'Combination of manual and automated testing',
                    resources: ['Test environment', 'Test data', 'Automation framework'],
                    timeline: '2 weeks',
                    exitCriteria: ['All critical tests pass', 'No open high-priority defects']
                }),
                exportFormat: 'json',
                status: 'draft',
                generatedAt: new Date(),
                testCases: []
            },
            {
                id: 'tp-2',
                name: 'User Dashboard Test Plan',
                description: 'Test plan for user dashboard functionality',
                jiraIssueId: 'DASH-456',
                generatedBy: 'llm-1',
                jiraConfigId: 'jira-1',
                content: JSON.stringify({
                    name: 'User Dashboard Test Plan',
                    description: 'Test plan for user dashboard functionality',
                    objectives: ['Verify dashboard loads correctly', 'Test data visualization', 'Validate user interactions'],
                    scope: {
                        inScope: ['Dashboard widgets', 'Data charts', 'User settings'],
                        outOfScope: ['Admin dashboard', 'System monitoring']
                    },
                    strategy: 'UI automation testing with manual verification',
                    resources: ['UI test framework', 'Mock data', 'Cross-browser testing'],
                    timeline: '3 weeks',
                    exitCriteria: ['All UI elements functional', 'Performance benchmarks met']
                }),
                exportFormat: 'json',
                status: 'draft',
                generatedAt: new Date(),
                testCases: []
            }
        ];
    }
    async generateTestPlan(generateTestPlanDto) {
        const { jiraIssueId, llmConfigId, exportFormat } = generateTestPlanDto;
        const content = {
            objectives: ['Verify core functionality', 'Test edge cases'],
            scope: { inScope: ['UI'], outOfScope: ['Security'] },
            strategy: 'Manual',
            resources: ['Staging'],
            timeline: '1 week',
            exitCriteria: ['All pass']
        };
        const testPlan = await this.prisma.testPlan.create({
            data: {
                name: `Test Plan for ${jiraIssueId}`,
                description: 'Generated test plan',
                jiraIssueId,
                generatedBy: llmConfigId,
                content: JSON.stringify(content),
                status: 'draft',
                exportFormat: exportFormat || 'json',
            },
        });
        return testPlan;
    }
    async getAllTestPlans() {
        return this.prisma.testPlan.findMany({
            include: {
                llmConfig: true,
                testCases: true,
            },
        });
    }
    async getTestPlan(id) {
        const testPlan = await this.prisma.testPlan.findUnique({
            where: { id },
            include: {
                llmConfig: true,
                testCases: true,
            },
        });
        if (!testPlan) {
            throw new common_1.NotFoundException('Test plan not found');
        }
        return testPlan;
    }
    async deleteTestPlan(id) {
        await this.prisma.testCase.deleteMany({
            where: { testPlanId: id },
        });
        return this.prisma.testPlan.delete({
            where: { id },
        });
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