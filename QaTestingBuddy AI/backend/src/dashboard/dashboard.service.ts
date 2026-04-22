import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  // constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    // Mock data for demonstration
    return {
      totalTestPlans: 5,
      totalTestCases: 25,
      generatedToday: 2,
      syncedToJira: 3,
      syncedToRally: 1,
      coverage: {
        manual: 65,
        automated: 35,
        coverage_percentage: 78,
      },
    };
  }

  async getActivity() {
    // Mock activity data
    return [
      {
        type: 'test_plan_generated',
        title: 'Generated test plan: User Authentication',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        status: 'success',
      },
      {
        type: 'test_case_generated',
        title: 'Created test case: Login validation',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        status: 'success',
      },
      {
        type: 'test_plan_generated',
        title: 'Generated test plan: Payment Processing',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        status: 'success',
      },
    ];
  }
}
