import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getMetrics(): Promise<{
        totalTestPlans: $Public.PrismaPromise<T>;
        totalTestCases: $Public.PrismaPromise<T>;
        generatedToday: $Public.PrismaPromise<T>;
        syncedToJira: $Public.PrismaPromise<T>;
        syncedToRally: $Public.PrismaPromise<T>;
        coverage: {
            manual: number;
            automated: number;
            coverage_percentage: number;
        };
    }>;
    getActivity(): Promise<any[]>;
}
