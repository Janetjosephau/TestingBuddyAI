import { TestPlanService } from './test-plan.service';
import { GenerateTestPlanDto } from './dto/generate-test-plan.dto';
export declare class TestPlanController {
    private readonly testPlanService;
    constructor(testPlanService: TestPlanService);
    generateTestPlan(generateTestPlanDto: GenerateTestPlanDto): Promise<any>;
    getAllTestPlans(): Promise<any>;
    getTestPlan(id: string): Promise<any>;
}
