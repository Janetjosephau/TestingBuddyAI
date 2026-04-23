import { TestPlanService } from './test-plan.service';
import { GenerateTestPlanDto } from './dto/generate-test-plan.dto';
export declare class TestPlanController {
    private readonly testPlanService;
    constructor(testPlanService: TestPlanService);
    generateTestPlan(generateTestPlanDto: GenerateTestPlanDto): Promise<{
        id: string;
        name: string;
        description: string;
        jiraIssueId: string;
        generatedAt: Date;
        content: string;
        exportFormat: string | null;
        status: string;
        generatedBy: string;
        jiraConfigId: string | null;
    }>;
    getAllTestPlans(): Promise<({
        llmConfig: {
            id: string;
            name: string;
            provider: string;
            apiKey: string;
            apiUrl: string | null;
            model: string;
            temperature: number | null;
            maxTokens: number | null;
            createdAt: Date;
            lastTestedAt: Date | null;
            testStatus: string;
            testError: string | null;
        };
        testCases: {
            id: string;
            status: string;
            createdAt: Date;
            testPlanId: string;
            caseId: string;
            title: string;
            preconditions: string;
            steps: string;
            postconditions: string;
            priority: string;
        }[];
    } & {
        id: string;
        name: string;
        description: string;
        jiraIssueId: string;
        generatedAt: Date;
        content: string;
        exportFormat: string | null;
        status: string;
        generatedBy: string;
        jiraConfigId: string | null;
    })[]>;
    getTestPlan(id: string): Promise<{
        llmConfig: {
            id: string;
            name: string;
            provider: string;
            apiKey: string;
            apiUrl: string | null;
            model: string;
            temperature: number | null;
            maxTokens: number | null;
            createdAt: Date;
            lastTestedAt: Date | null;
            testStatus: string;
            testError: string | null;
        };
        testCases: {
            id: string;
            status: string;
            createdAt: Date;
            testPlanId: string;
            caseId: string;
            title: string;
            preconditions: string;
            steps: string;
            postconditions: string;
            priority: string;
        }[];
    } & {
        id: string;
        name: string;
        description: string;
        jiraIssueId: string;
        generatedAt: Date;
        content: string;
        exportFormat: string | null;
        status: string;
        generatedBy: string;
        jiraConfigId: string | null;
    }>;
    deleteTestPlan(id: string): Promise<{
        id: string;
        name: string;
        description: string;
        jiraIssueId: string;
        generatedAt: Date;
        content: string;
        exportFormat: string | null;
        status: string;
        generatedBy: string;
        jiraConfigId: string | null;
    }>;
}
