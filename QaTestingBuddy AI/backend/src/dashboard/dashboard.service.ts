import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    // Get test plan count
    const totalTestPlans = await this.prisma.testPlan.count();

    // Get test case count
    const totalTestCases = await this.prisma.testCase.count();

    // Get today's generated count (mock for now)
    const generatedToday = await this.prisma.testPlan.count({
      where: {
        generatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    // Mock synced counts (would need to track this in real implementation)
    const syncedToJira = await this.prisma.testPlan.count({
      where: { status: 'synced_to_jira' },
    });

    const syncedToRally = await this.prisma.testCase.count({
      where: { status: 'synced_to_rally' },
    });

    // Calculate coverage (mock calculation)
    const coverage = {
      manual: 65,
      automated: 35,
      coverage_percentage: 78,
    };

    return {
      totalTestPlans,
      totalTestCases,
      generatedToday,
      syncedToJira,
      syncedToRally,
      coverage,
    };
  }

  async getActivity() {
    // Get recent test plans and test cases
    const recentTestPlans = await this.prisma.testPlan.findMany({
      take: 5,
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        generatedAt: true,
        status: true,
      },
    });

    const recentTestCases = await this.prisma.testCase.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        status: true,
        testPlan: {
          select: { name: true },
        },
      },
    });

    // Combine and format activities
    const activities = [
      ...recentTestPlans.map(plan => ({
        type: 'test_plan_generated' as const,
        title: `Generated test plan: ${plan.name}`,
        timestamp: plan.generatedAt,
        status: 'success' as const,
      })),
      ...recentTestCases.map(testCase => ({
        type: 'test_case_generated' as const,
        title: `Created test case: ${testCase.title}`,
        timestamp: testCase.createdAt,
        status: 'success' as const,
      })),
    ];

    // Sort by timestamp and take most recent 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }
}
