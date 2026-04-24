import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    const [totalPlans, totalCases, llmConfigs, rallyConfigs] = await Promise.all([
      this.prisma.testPlan.count(),
      this.prisma.testCase.count(),
      this.prisma.lLMConfig.count(),
      this.prisma.rallyConfig.count(),
    ]);

    return {
      totalTestPlans: totalPlans,
      totalTestCases: totalCases,
      activeLLMs: llmConfigs,
      activeRally: rallyConfigs,
      generatedToday: 0, // Placeholder
      coverage: {
        manual: 100,
        automated: 0,
        coverage_percentage: 100,
      },
    };
  }

  async getActivity() {
    // Return the 5 most recent test plans as recent activity
    const plans = await this.prisma.testPlan.findMany({
      take: 5,
      orderBy: { generatedAt: 'desc' },
    });

    return plans.map(p => ({
      type: 'test_plan_generated',
      title: `Generated test plan: ${p.name}`,
      timestamp: p.generatedAt,
      status: 'success',
      id: p.id
    }));
  }
}
