import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LlmService } from '../llm/llm.service';
import { GenerateTestPlanDto } from './dto/generate-test-plan.dto';

@Injectable()
export class TestPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
  ) {}

  async generateTestPlan(generateTestPlanDto: GenerateTestPlanDto) {
    const { jiraIssueId, jiraRequirement, llmConfigId, jiraConfigId, additionalRequirements, exportFormat } = generateTestPlanDto;

    // Get LLM config
    const llmConfig = await this.prisma.lLMConfig.findUnique({
      where: { id: llmConfigId },
    });

    if (!llmConfig) {
      throw new NotFoundException('LLM configuration not found');
    }

    // Parse Jira requirement
    let requirement;
    try {
      requirement = JSON.parse(jiraRequirement);
    } catch (error) {
      throw new Error('Invalid Jira requirement format');
    }

    // Generate test plan using LLM
    const prompt = this.buildTestPlanPrompt(requirement, additionalRequirements);

    const generationResult = await this.llmService.generateText(llmConfigId, prompt);
    let testPlanContent;

    if (!generationResult.success || !generationResult.text) {
      throw new Error(`Failed to generate test plan: ${generationResult.error}`);
    }

    try {
      // Attempt to parse the LLM text output as JSON
      // Extract JSON block if it's wrapped in markdown codeblocks
      const match = generationResult.text.match(/```json\n([\s\S]*?)\n```/) || generationResult.text.match(/```([\s\S]*?)\n```/);
      const jsonString = match ? match[1].trim() : generationResult.text.trim();
      testPlanContent = JSON.parse(jsonString);

      // Verify necessary fields
      testPlanContent.name = testPlanContent.name || `Test Plan for ${requirement.key}: ${requirement.title}`;
      testPlanContent.description = testPlanContent.description || `Comprehensive test plan for ${requirement.key}`;
    } catch (e) {
      throw new Error(`Failed to parse LLM response into required JSON format. Raw output: ${generationResult.text.substring(0, 100)}...`);
    }

    const testPlanData = testPlanContent;

    // Create test plan in database
    const testPlan = await this.prisma.testPlan.create({
      data: {
        name: testPlanData.name,
        description: testPlanData.description,
        jiraIssueId,
        generatedBy: llmConfigId,
        jiraConfigId,
        content: JSON.stringify(testPlanData),
        exportFormat,
        status: 'draft',
      },
    });

    return {
      id: testPlan.id,
      ...testPlanData,
      generatedAt: testPlan.generatedAt,
      status: testPlan.status,
    };
  }

  async getAllTestPlans() {
    const testPlans = await this.prisma.testPlan.findMany({
      include: {
        testCases: true,
        llmConfig: {
          select: { name: true, provider: true }
        }
      },
      orderBy: { generatedAt: 'desc' },
    });

    return testPlans.map(plan => ({
      ...plan,
      content: JSON.parse(plan.content),
    }));
  }

  async getTestPlan(id: string) {
    const testPlan = await this.prisma.testPlan.findUnique({
      where: { id },
      include: {
        testCases: true,
        llmConfig: {
          select: { name: true, provider: true }
        }
      },
    });

    if (!testPlan) {
      throw new NotFoundException('Test plan not found');
    }

    return {
      ...testPlan,
      content: JSON.parse(testPlan.content),
    };
  }

  private buildTestPlanPrompt(requirement: any, additionalRequirements?: string[]): string {
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
}