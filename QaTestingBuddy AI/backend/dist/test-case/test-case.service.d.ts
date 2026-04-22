import { PrismaService } from '../database/prisma.service';
import { LlmService } from '../llm/llm.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { GenerateTestCasesDto } from './dto/generate-test-cases.dto';
export declare class TestCaseService {
    private readonly prisma;
    private readonly llmService;
    constructor(prisma: PrismaService, llmService: LlmService);
    createTestCase(createTestCaseDto: CreateTestCaseDto): Promise<any>;
    getAllTestCases(): Promise<any>;
    getTestCase(id: string): Promise<any>;
    updateTestCase(id: string, updateTestCaseDto: UpdateTestCaseDto): Promise<any>;
    deleteTestCase(id: string): Promise<{
        message: string;
    }>;
    generateTestCases(generateTestCasesDto: GenerateTestCasesDto): Promise<{
        success: boolean;
        message: string;
        testCases: any[];
    }>;
}
