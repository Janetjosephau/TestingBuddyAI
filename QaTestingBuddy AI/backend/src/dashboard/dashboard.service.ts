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
    const [plans, cases] = await Promise.all([
      this.prisma.testPlan.findMany({
        take: 5,
        orderBy: { generatedAt: 'desc' },
      }),
      this.prisma.testCase.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      })
    ]);

    const activity = [
      ...plans.map(p => ({
        type: 'test_plan_generated',
        title: `Plan generated: ${p.name}`,
        timestamp: p.generatedAt,
        status: 'success',
        id: `plan-${p.id}`
      })),
      ...cases.map(c => ({
        type: 'test_case_generated',
        title: `Case generated: ${c.title}`,
        timestamp: c.createdAt,
        status: 'success',
        id: `case-${c.id}`
      }))
    ];

    // Sort by most recent first and take top 8
    return activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);
  }
}
