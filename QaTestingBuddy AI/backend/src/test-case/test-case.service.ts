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

  async createTestCase(createTestCaseDto: CreateTestCaseDto) {
    // Verify test plan exists
    const testPlan = await this.prisma.testPlan.findUnique({
      where: { id: createTestCaseDto.testPlanId },
    });

    if (!testPlan) {
      throw new NotFoundException('Test plan not found');
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

  async getTestCase(id: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id },
      include: {
        testPlan: {
          select: { name: true, jiraIssueId: true }
        }
      },
    });

    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }

    return {
      ...testCase,
      preconditions: JSON.parse(testCase.preconditions),
      steps: JSON.parse(testCase.steps),
      postconditions: JSON.parse(testCase.postconditions),
    };
  }

  async updateTestCase(id: string, updateTestCaseDto: UpdateTestCaseDto) {
    const existingTestCase = await this.prisma.testCase.findUnique({
      where: { id },
    });

    if (!existingTestCase) {
      throw new NotFoundException('Test case not found');
    }

    const updateData: any = { ...updateTestCaseDto };

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

  async deleteTestCase(id: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id },
    });

    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }

    await this.prisma.testCase.delete({
      where: { id },
    });

    return { message: 'Test case deleted successfully' };
  }

  async generateTestCases(generateTestCasesDto: GenerateTestCasesDto) {
    const { testPlanId, llmConfigId, additionalInstructions } = generateTestCasesDto;

    // Verify test plan exists
    const testPlan = await this.prisma.testPlan.findUnique({
      where: { id: testPlanId },
    });

    if (!testPlan) {
      throw new NotFoundException('Test plan not found');
    }

    // Prepare prompt
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
    } catch (e) {
      throw new Error(`Failed to parse LLM response into array of test cases. Raw output: ${result.text.substring(0, 100)}...`);
    }

    // Save test cases to database
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
}