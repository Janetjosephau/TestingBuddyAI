import axios from 'axios';

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

export async function testRallyConnection(payload: RallyConnectionPayload) {
  const response = await axios.get(`${payload.url}/slm/webservice/v2.0/security/authorize`, {
    headers: {
      'ZSESSIONID': payload.apiKey,
      Accept: 'application/json',
    },
    timeout: 15000,
  });
  return { ok: response.status === 200 };
}

export async function fetchRallyIssues(payload: RallyFetchPayload) {
  let query = '(FormattedID != null)';
  if (payload.issueId) {
    query = `(FormattedID = "${payload.issueId}")`;
  } else if (payload.projectKey) {
    query = `(Project.Name = "${payload.projectKey}")`;
  }
  const url = `${payload.url}/slm/webservice/v2.0/hierarchicalrequirement?query=${encodeURIComponent(query)}&fetch=FormattedID,Name,Description,TaskActualTotal,ScheduleState,PlanEstimate,Owner,Release`;
  const response = await axios.get(url, {
    headers: {
      'ZSESSIONID': payload.apiKey,
      Accept: 'application/json',
    },
    timeout: 30000,
  });

  const results = Array.isArray(response.data?.QueryResult?.Results)
    ? response.data.QueryResult.Results
    : [];
  return results.map((item: any) => ({
    issueId: item.FormattedID,
    summary: item.Name,
    description: item.Description || '',
    type: 'User Story',
    priority: '',
    labels: [],
    acceptanceCriteria: [],
    customFields: {},
  }));
}
