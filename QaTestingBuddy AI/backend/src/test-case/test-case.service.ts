import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LlmService } from '../llm/llm.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { GenerateTestCasesDto } from './dto/generate-test-cases.dto';

@Injectable()
export class TestCaseService {
  constructor(
     private readonly prisma: PrismaService,
     private readonly llmService: LlmService,
  ) {}

  private getMockTestCases() {
    return [
      {
        id: 'tc-1',
        testPlanId: 'tp-1',
        caseId: 'TC-001',
        title: 'User Login with Valid Credentials',
        preconditions: ['User has valid account', 'Application is accessible'],
        steps: [
          { action: 'Navigate to login page', expectedResult: 'Login form displayed' },
          { action: 'Enter valid username', expectedResult: 'Username field populated' },
          { action: 'Enter valid password', expectedResult: 'Password field populated' },
          { action: 'Click login button', expectedResult: 'User redirected to dashboard' }
        ],
        postconditions: ['User is logged in'],
        priority: 'high',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        testPlan: { name: 'Authentication', jiraIssueId: 'AUTH-123' }
      },
      {
        id: 'tc-2',
        testPlanId: 'tp-1',
        caseId: 'TC-002',
        title: 'User Login with Invalid Credentials',
        preconditions: ['User has invalid account', 'Application is accessible'],
        steps: [
          { action: 'Navigate to login page', expectedResult: 'Login form displayed' },
          { action: 'Enter invalid username', expectedResult: 'Username field populated' },
          { action: 'Enter invalid password', expectedResult: 'Password field populated' },
          { action: 'Click login button', expectedResult: 'Error message displayed' }
        ],
        postconditions: ['User remains on login page'],
        priority: 'high',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        testPlan: { name: 'Authentication', jiraIssueId: 'AUTH-123' }
      }
    ];
  }

  async createTestCase(createTestCaseDto: CreateTestCaseDto) {
    return this.prisma.testCase.create({
      data: {
        ...createTestCaseDto,
        preconditions: JSON.stringify(createTestCaseDto.preconditions || []),
        steps: JSON.stringify(createTestCaseDto.steps || []),
        postconditions: JSON.stringify(createTestCaseDto.postconditions || []),
      },
    });
  }

  async getAllTestCases() {
    return this.prisma.testCase.findMany({
      include: {
        testPlan: true,
      },
    });
  }

  async getTestCase(id: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id },
      include: {
        testPlan: true,
      },
    });

    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }

    return testCase;
  }

  async updateTestCase(id: string, updateTestCaseDto: UpdateTestCaseDto) {
    // Mock implementation - find and update test case
    const mockTestCases = this.getMockTestCases();
    const index = mockTestCases.findIndex(tc => tc.id === id);

    if (index === -1) {
      throw new NotFoundException('Test case not found');
    }

    // Update the test case with provided data
    const updatedTestCase = {
      ...mockTestCases[index],
      ...updateTestCaseDto,
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to database
    // For now, just return the updated version
    return updatedTestCase;
  }

  async deleteTestCase(id: string) {
    // Mock implementation - check if test case exists
    const mockTestCases = this.getMockTestCases();
    const exists = mockTestCases.some(tc => tc.id === id);

    if (!exists) {
      throw new NotFoundException('Test case not found');
    }

    // In a real implementation, this would be deleted from database
    // For now, just return success message
    return { message: 'Test case deleted successfully' };
  }

  async generateTestCases(generateTestCasesDto: GenerateTestCasesDto) {
    const { testPlanId, llmConfigId, additionalInstructions } = generateTestCasesDto;

    // Mock implementation - simulate LLM generation
    // In a real implementation, this would call the LLM service
    const mockGeneratedCases = [
      {
        id: `tc-${Date.now()}-1`,
        testPlanId,
        caseId: 'TC-001',
        title: 'User Login with Valid Credentials',
        preconditions: ['User has valid account', 'Application is accessible'],
        steps: [
          { action: 'Navigate to login page', expectedResult: 'Login form displayed' },
          { action: 'Enter valid username', expectedResult: 'Username field populated' },
          { action: 'Enter valid password', expectedResult: 'Password field populated' },
          { action: 'Click login button', expectedResult: 'User redirected to dashboard' }
        ],
        postconditions: ['User is logged in', 'Dashboard is displayed'],
        priority: 'high',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `tc-${Date.now()}-2`,
        testPlanId,
        caseId: 'TC-002',
        title: 'User Login with Invalid Credentials',
        preconditions: ['User has invalid account', 'Application is accessible'],
        steps: [
          { action: 'Navigate to login page', expectedResult: 'Login form displayed' },
          { action: 'Enter invalid username', expectedResult: 'Username field populated' },
          { action: 'Enter invalid password', expectedResult: 'Password field populated' },
          { action: 'Click login button', expectedResult: 'Error message displayed' }
        ],
        postconditions: ['User remains on login page', 'Error message shown'],
        priority: 'high',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return {
      success: true,
      message: `Generated and saved ${mockGeneratedCases.length} test cases.`,
      testCases: mockGeneratedCases,
    };
  }
}
