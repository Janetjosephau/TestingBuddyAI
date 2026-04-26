import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LlmService } from '../llm/llm.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { GenerateTestCasesDto } from './dto/generate-test-cases.dto';
import { parseRobustJson } from '../utils/json-parser';

@Injectable()
export class TestCaseService {
  constructor(
     private readonly prisma: PrismaService,
     private readonly llmService: LlmService,
  ) {}

  async generateTestCases(dto: GenerateTestCasesDto) {
    const { testPlanId, llmConfigId, additionalInstructions, requirementBody } = dto;

    const prompt = `
      You are an expert QA Automation Engineer. Generate comprehensive test cases based on the following requirement:
      
      REQUIREMENT:
      ${requirementBody || 'No requirement details provided.'}

      USER INSTRUCTIONS:
      ${additionalInstructions || 'Generate standard functional test cases.'}

      Return ONLY a JSON array of objects. Each object MUST have this structure:
      {
        "caseId": "TC-001",
        "title": "Short descriptive title",
        "preconditions": ["List of strings"],
        "steps": [{"action": "string", "expectedResult": "string"}],
        "postconditions": ["List of strings"],
        "priority": "high", // "low", "medium", "high", "critical"
        "testData": "JSON string or description of data required",
        "automationTags": ["smoke", "regression", "api", "ui"] 
      }
      
      CRITICAL: Return ONLY valid JSON starting with [ and ending with ]. Do NOT include any markdown formatting, backticks, or intro/outro text.
    `;

    try {
      const resultText = await this.llmService.generateText(prompt, llmConfigId);
      
      const generatedCases = parseRobustJson(resultText);

      const savedCases = [];

      for (const tc of generatedCases) {
        const saved = await this.prisma.testCase.create({
          data: {
            testPlanId: testPlanId !== 'manual-gen' ? testPlanId : (await this.getOrCreateDefaultPlan()).id,
            caseId: tc.caseId,
            title: tc.title,
            preconditions: JSON.stringify(tc.preconditions || []),
            steps: JSON.stringify(tc.steps || []),
            postconditions: JSON.stringify(tc.postconditions || []),
            priority: tc.priority || 'medium',
            testData: tc.testData ? JSON.stringify(tc.testData) : null,
            automationTags: tc.automationTags ? JSON.stringify(tc.automationTags) : null,
            status: 'draft',
          }
        });
        
        savedCases.push({
          ...saved,
          preconditions: JSON.parse(saved.preconditions),
          steps: JSON.parse(saved.steps),
          postconditions: JSON.parse(saved.postconditions),
          testData: saved.testData ? JSON.parse(saved.testData) : null,
          automationTags: saved.automationTags ? JSON.parse(saved.automationTags) : null,
        });
      }

      return {
        success: true,
        message: `Generated and saved ${savedCases.length} test cases.`,
        testCases: savedCases,
      };
    } catch (error: any) {
      console.error('Generation Error:', error);
      throw new BadRequestException(`Failed to generate test cases: ${error.message}`);
    }
  }

  private async getOrCreateDefaultPlan() {
    let plan = await this.prisma.testPlan.findFirst({
      where: { name: 'Ad-hoc Generated Plan' }
    });
    
    if (!plan) {
      // Need an LLM config for relation
      const llm = await this.prisma.lLMConfig.findFirst();
      if (!llm) throw new BadRequestException('No LLM configuration found. Please create one first.');
      
      plan = await this.prisma.testPlan.create({
        data: {
          name: 'Ad-hoc Generated Plan',
          description: 'Automatically created for decoupled test case generation',
          jiraIssueId: 'GEN-1',
          generatedBy: llm.id,
          content: '{}',
          status: 'draft'
        }
      });
    }
    return plan;
  }

  async createTestCase(createTestCaseDto: CreateTestCaseDto) {
    return this.prisma.testCase.create({
      data: {
        ...createTestCaseDto,
        preconditions: JSON.stringify(createTestCaseDto.preconditions || []),
        steps: JSON.stringify(createTestCaseDto.steps || []),
        postconditions: JSON.stringify(createTestCaseDto.postconditions || []),
        testData: createTestCaseDto.testData ? JSON.stringify(createTestCaseDto.testData) : null,
        automationTags: createTestCaseDto.automationTags ? JSON.stringify(createTestCaseDto.automationTags) : null,
      },
    });
  }

  async getAllTestCases() {
    const cases = await this.prisma.testCase.findMany({
      include: { testPlan: true },
    });
    return cases.map(tc => ({
      ...tc,
      preconditions: JSON.parse(tc.preconditions),
      steps: JSON.parse(tc.steps),
      postconditions: JSON.parse(tc.postconditions),
      testData: tc.testData ? JSON.parse(tc.testData) : null,
      automationTags: tc.automationTags ? JSON.parse(tc.automationTags) : null,
    }));
  }

  async getTestCase(id: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id },
      include: { testPlan: true },
    });
    if (!testCase) throw new NotFoundException('Test case not found');
    return {
      ...testCase,
      preconditions: JSON.parse(testCase.preconditions),
      steps: JSON.parse(testCase.steps),
      postconditions: JSON.parse(testCase.postconditions),
      testData: testCase.testData ? JSON.parse(testCase.testData) : null,
      automationTags: testCase.automationTags ? JSON.parse(testCase.automationTags) : null,
    };
  }

  async updateTestCase(id: string, updateTestCaseDto: UpdateTestCaseDto) {
    const data: any = { ...updateTestCaseDto };
    if (updateTestCaseDto.preconditions) data.preconditions = JSON.stringify(updateTestCaseDto.preconditions);
    if (updateTestCaseDto.steps) data.steps = JSON.stringify(updateTestCaseDto.steps);
    if (updateTestCaseDto.postconditions) data.postconditions = JSON.stringify(updateTestCaseDto.postconditions);
    if (updateTestCaseDto.testData) data.testData = JSON.stringify(updateTestCaseDto.testData);
    if (updateTestCaseDto.automationTags) data.automationTags = JSON.stringify(updateTestCaseDto.automationTags);

    return this.prisma.testCase.update({
      where: { id },
      data
    });
  }

  async deleteTestCase(id: string) {
    await this.prisma.testCase.delete({ where: { id } });
    return { message: 'Test case deleted successfully' };
  }
}
