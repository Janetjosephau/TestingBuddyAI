import { PrismaService } from '../database/prisma.service';
import { LlmService } from '../llm/llm.service';
import { GenerateTestPlanDto } from './dto/generate-test-plan.dto';
export declare class TestPlanService {
    private readonly prisma;
    private readonly llmService;
    constructor(prisma: PrismaService, llmService: LlmService);
    generateTestPlan(generateTestPlanDto: GenerateTestPlanDto): Promise<any>;
    getAllTestPlans(): Promise<any>;
    getTestPlan(id: string): Promise<any>;
    private buildTestPlanPrompt;
}
