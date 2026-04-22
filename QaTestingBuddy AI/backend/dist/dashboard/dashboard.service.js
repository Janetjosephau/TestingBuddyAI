"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMetrics() {
        const totalTestPlans = await this.prisma.testPlan.count();
        const totalTestCases = await this.prisma.testCase.count();
        const generatedToday = await this.prisma.testPlan.count({
            where: {
                generatedAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        });
        const syncedToJira = await this.prisma.testPlan.count({
            where: { status: 'synced_to_jira' },
        });
        const syncedToRally = await this.prisma.testCase.count({
            where: { status: 'synced_to_rally' },
        });
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
        const activities = [
            ...recentTestPlans.map(plan => ({
                type: 'test_plan_generated',
                title: `Generated test plan: ${plan.name}`,
                timestamp: plan.generatedAt,
                status: 'success',
            })),
            ...recentTestCases.map(testCase => ({
                type: 'test_case_generated',
                title: `Created test case: ${testCase.title}`,
                timestamp: testCase.createdAt,
                status: 'success',
            })),
        ];
        return activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map