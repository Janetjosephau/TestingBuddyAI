export declare class GenerateTestPlanDto {
    jiraIssueId: string;
    jiraRequirement: string;
    llmConfigId: string;
    jiraConfigId?: string;
    additionalRequirements?: string[];
    exportFormat?: string;
}
