import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const llmApi = {
  testConnection: (data: any) => api.post('/llm/test-connection', data),
  saveConfig: (data: any) => api.post('/llm/configs', data),
  getConfigs: () => api.get('/llm/configs'),
  getConfig: (id: string) => api.get(`/llm/configs/${id}`),
  updateConfig: (id: string, data: any) => api.put(`/llm/configs/${id}`, data),
  deleteConfig: (id: string) => api.delete(`/llm/configs/${id}`),
};

export const jiraApi = {
  testConnection: (data: any) => api.post('/jira/test-connection', data),
  saveConfig: (data: any) => api.post('/jira/configs', data),
  getConfigs: () => api.get('/jira/configs'),
  getConfig: (id: string) => api.get(`/jira/configs/${id}`),
  updateConfig: (id: string, data: any) => api.put(`/jira/configs/${id}`, data),
  deleteConfig: (id: string) => api.delete(`/jira/configs/${id}`),
  fetchRequirements: (data: any) => api.post('/jira/requirements', data),
  getProjects: (data: any) => api.post('/jira/projects', data),
};

export const testPlanApi = {
  generate: (data: any) => api.post('/test-plans/generate', data),
  getAll: () => api.get('/test-plans'),
  getById: (id: string) => api.get(`/test-plans/${id}`),
};

export const testCaseApi = {
  generate: (data: any) => api.post('/test-cases/generate', data),
  create: (data: any) => api.post('/test-cases', data),
  getAll: () => api.get('/test-cases'),
  getById: (id: string) => api.get(`/test-cases/${id}`),
  update: (id: string, data: any) => api.put(`/test-cases/${id}`, data),
  delete: (id: string) => api.delete(`/test-cases/${id}`),
};

export const dashboardApi = {
  getMetrics: () => api.get('/dashboard/metrics'),
  getActivity: () => api.get('/dashboard/activity'),
};

export const generatorApi = {
  getTestPlans: () => testPlanApi.getAll(),
  generateTestPlan: (data: any) => testPlanApi.generate(data),
  generateTestCases: (data: any) => testCaseApi.generate(data),
};

export default api;
