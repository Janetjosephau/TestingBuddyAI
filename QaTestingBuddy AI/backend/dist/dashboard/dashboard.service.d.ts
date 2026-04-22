import { PrismaService } from '../database/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
