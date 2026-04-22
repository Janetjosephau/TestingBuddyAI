import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const llmApi = {
  testConnection: (data: any) => api.post('/llm/test-connection', data),
  saveConfig: (data: any) => api.post('/llm/configs', data),
  getConfigs: () => api.get('/llm/configs'),
  deleteConfig: (id: string) => api.delete(`/llm/configs/${id}`),
};

export const jiraApi = {
  testConnection: (data: any) => api.post('/jira/test-connection', data),
  saveConfig: (data: any) => api.post('/jira/configs', data),
  getConfigs: () => api.get('/jira/configs'),
  fetchRequirements: (data: any) => api.post('/jira/requirements', data),
  getProjects: (data: any) => api.post('/jira/projects', data), // Using post because it involves credentials natively for now
};

export const generatorApi = {
  generateTestPlan: (data: any) => api.post('/test-plans/generate', data),
  getTestPlans: () => api.get('/test-plans'),
  generateTestCases: (data: any) => api.post('/test-cases/generate', data),
  getTestCases: () => api.get('/test-cases'),
};

export default api;
