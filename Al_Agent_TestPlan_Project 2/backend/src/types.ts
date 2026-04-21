export type JiraConnectionPayload = {
  url: string;
  email: string;
  apiToken: string;
};

export type JiraFetchPayload = JiraConnectionPayload & {
  issueId?: string;
  projectKey?: string;
  sprintOrFixVersion?: string;
  additionalContext?: string;
};

export type RallyConnectionPayload = {
  url: string;
  apiKey: string;
};

export type RallyFetchPayload = RallyConnectionPayload & {
  issueId?: string;
  projectKey?: string;
  sprintOrFixVersion?: string;
  additionalContext?: string;
};

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

export type LlmTestPayload = {
  provider: 'ollama' | 'grok' | 'openai' | 'lmstudio';
  model?: 'mistral:7b' | 'llama3:latest' | 'qwen3:4b';
  apiKey?: string;
  endpoint?: string;
};

export type GenerateTestPlanPayload = {
  provider: 'ollama' | 'grok' | 'openai' | 'lmstudio';
  model?: 'mistral:7b' | 'llama3:latest' | 'qwen3:4b';
  apiKey?: string;
  endpoint?: string;
  context: string;
  issues: IssuePayload[];
  templateName?: string;
};
