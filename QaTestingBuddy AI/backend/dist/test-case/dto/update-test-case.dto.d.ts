export declare class UpdateTestCaseDto {
    testPlanId?: string;
    caseId?: string;
    title?: string;
    preconditions?: string[];
    steps?: Array<{
        action: string;
        expectedResult: string;
    }>;
    postconditions?: string[];
    priority?: string;
    status?: string;
}
