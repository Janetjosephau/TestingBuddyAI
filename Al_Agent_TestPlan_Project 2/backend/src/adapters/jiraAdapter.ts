import axios from 'axios';

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

function getAuthHeader(email: string, token: string) {
  const encoded = Buffer.from(`${email}:${token}`).toString('base64');
  return `Basic ${encoded}`;
}

function normalizeJiraUrl(rawUrl: string) {
  const trimmed = (rawUrl || '').trim().replace(/\/+$/, '');
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    const path = parsed.pathname.replace(/\/+$/, '');
    const uiPrefixes = ['/browse', '/secure', '/jira/software', '/projects', '/issues'];
    const isUiPath = uiPrefixes.some(prefix => path === prefix || path.startsWith(`${prefix}/`));

    parsed.pathname = isUiPath ? '' : path;
    parsed.search = '';
    parsed.hash = '';

    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return withProtocol;
  }
}

function getAuthHeaders(payload: JiraConnectionPayload) {
  return {
    Authorization: getAuthHeader(payload.email, payload.apiToken),
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

function isHtmlResponse(data: unknown) {
  return typeof data === 'string' && /<!DOCTYPE html>|<html/i.test(data);
}

function buildDeadLinkError(baseUrl: string) {
  return new Error(
    `Jira returned a dead-link HTML page. Use the Jira base URL only, for example ${baseUrl}, not a project or issue page URL.`
  );
}

async function callJiraMyself(payload: JiraConnectionPayload) {
  const baseUrl = normalizeJiraUrl(payload.url);
  const candidates = [`${baseUrl}/rest/api/3/myself`, `${baseUrl}/rest/api/2/myself`];
  let lastError: unknown;

  for (const url of candidates) {
    try {
      const response = await axios.get(url, {
        headers: getAuthHeaders(payload),
        timeout: 15000,
      });

      if (isHtmlResponse(response.data)) {
        throw buildDeadLinkError(baseUrl);
      }

      return response;
    } catch (err: unknown) {
      lastError = err;
    }
  }

  if (axios.isAxiosError(lastError) && isHtmlResponse(lastError.response?.data)) {
    throw buildDeadLinkError(baseUrl);
  }

  throw lastError;
}

async function searchJira(payload: JiraFetchPayload, jql: string) {
  const baseUrl = normalizeJiraUrl(payload.url);
  const requestBody = {
    jql,
    maxResults: 20,
    fields: ['summary', 'description', 'issuetype', 'priority', 'labels', 'customfield_10002'],
  };
  const candidates = [
    `${baseUrl}/rest/api/3/search/jql`,
    `${baseUrl}/rest/api/2/search`,
  ];
  let lastError: unknown;

  for (const url of candidates) {
    try {
      const response = await axios.post(url, requestBody, {
        headers: getAuthHeaders(payload),
        timeout: 30000,
      });

      if (isHtmlResponse(response.data)) {
        throw buildDeadLinkError(baseUrl);
      }

      return response;
    } catch (err: unknown) {
      lastError = err;
    }
  }

  if (axios.isAxiosError(lastError) && isHtmlResponse(lastError.response?.data)) {
    throw buildDeadLinkError(baseUrl);
  }

  throw lastError;
}

export async function testJiraConnection(payload: JiraConnectionPayload) {
  const response = await callJiraMyself(payload);
  return {
    ok: response.status === 200,
    user: response.data.displayName,
    baseUrl: normalizeJiraUrl(payload.url),
  };
}

export async function fetchJiraIssues(payload: JiraFetchPayload) {
  const jqlParts = [] as string[];

  if (payload.issueId) {
    jqlParts.push(`issuekey = ${payload.issueId}`);
  }
  if (payload.projectKey) {
    jqlParts.push(`project = ${payload.projectKey}`);
  }
  if (payload.sprintOrFixVersion) {
    jqlParts.push(`(Sprint ~ "${payload.sprintOrFixVersion}" OR fixVersion ~ "${payload.sprintOrFixVersion}")`);
  }

  if (!jqlParts.length) {
    throw new Error('Jira fetch requires at least one of Issue ID, Project Key, or Sprint/Fix Version.');
  }

  const jql = `${jqlParts.join(' AND ')} ORDER BY created DESC`;
  const response = await searchJira(payload, jql);

  const issues = Array.isArray(response.data?.issues) ? response.data.issues : [];
  return issues.map((issue: any) => ({
    issueId: issue.key,
    summary: issue.fields?.summary || '',
    description: issue.fields?.description || '',
    type: issue.fields?.issuetype?.name || '',
    priority: issue.fields?.priority?.name || '',
    labels: issue.fields?.labels || [],
    acceptanceCriteria: [],
    customFields: {},
  }));
}
