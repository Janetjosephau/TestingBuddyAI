export type IssuePayload = {
  issueId: string;
  summary: string;
  description: string;
  type: string;
  priority: string;
  labels: string[];
  acceptanceCriteria: string[];
  customFields: Record<string, any>;
};

export type PlanPreview = {
  planPreview: string;
  templateSections: Array<{ title: string; content: string }>;
  issues: IssuePayload[];
};
