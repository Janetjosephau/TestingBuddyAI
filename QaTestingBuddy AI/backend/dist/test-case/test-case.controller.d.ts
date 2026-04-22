import { TestCaseService } from './test-case.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { GenerateTestCasesDto } from './dto/generate-test-cases.dto';
export declare class TestCaseController {
    private readonly testCaseService;
    constructor(testCaseService: TestCaseService);
    generateTestCases(generateTestCasesDto: GenerateTestCasesDto): Promise<{
        success: boolean;
        message: string;
        testCases: any[];
    }>;
    createTestCase(createTestCaseDto: CreateTestCaseDto): Promise<any>;
    getAllTestCases(): Promise<any>;
    getTestCase(id: string): Promise<any>;
    updateTestCase(id: string, updateTestCaseDto: UpdateTestCaseDto): Promise<any>;
    deleteTestCase(id: string): Promise<{
        message: string;
    }>;
}
