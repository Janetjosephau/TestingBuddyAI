import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async generateTestCases(dto: GenerateTestCasesDto) {
    const { testPlanId, llmConfigId, additionalInstructions } = dto;

    const prompt = `
      You are an expert QA Automation Engineer. Generate 5 comprehensive test cases based on the following instructions:
      "${additionalInstructions}"

      Return ONLY a JSON array of objects. Each object MUST have this structure:
      {
        "caseId": "TC-001",
        "title": "Short descriptive title",
        "preconditions": ["List of strings"],
        "steps": [{"action": "string", "expectedResult": "string"}],
        "postconditions": ["List of strings"],
        "priority": "high" // "low", "medium", "high", "critical"
      }
      
      Do NOT include any markdown formatting, backticks, or extra text. JUST the JSON array.
    `;

    try {
      const resultText = await this.llmService.generateText(prompt, llmConfigId);
      
      // Basic cleanup of potential markdown bloat
      const cleanedJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const generatedCases = JSON.parse(cleanedJson);

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
            status: 'draft',
          }
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
    };
  }

  async updateTestCase(id: string, updateTestCaseDto: UpdateTestCaseDto) {
    const data: any = { ...updateTestCaseDto };
    if (updateTestCaseDto.preconditions) data.preconditions = JSON.stringify(updateTestCaseDto.preconditions);
    if (updateTestCaseDto.steps) data.steps = JSON.stringify(updateTestCaseDto.steps);
    if (updateTestCaseDto.postconditions) data.postconditions = JSON.stringify(updateTestCaseDto.postconditions);

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
