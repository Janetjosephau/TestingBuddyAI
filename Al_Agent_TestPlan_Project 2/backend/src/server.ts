import axios from 'axios';
import cors from 'cors';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { testJiraConnection, fetchJiraIssues } from './adapters/jiraAdapter';
import { testRallyConnection, fetchRallyIssues } from './adapters/rallyAdapter';
import { testLlmConnection, generateTestPlan } from './prompts/testPlanPrompt';
import { PORT } from './config';

function buildErrorResponse(err: any) {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;
    return {
      error: typeof data === 'string' ? data : data?.error || JSON.stringify(data) || err.message,
      status,
      url: err.config?.url,
      method: err.config?.method,
    };
  }
  return { error: String(err) };
}

dotenv.config();

export const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

app.post('/jira/test-connection', async (req: Request, res: Response) => {
  try {
    const result = await testJiraConnection(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/rally/test-connection', async (req: Request, res: Response) => {
  try {
    const result = await testRallyConnection(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/jira/fetch-issues', async (req: Request, res: Response) => {
  try {
    const issues = await fetchJiraIssues(req.body);
    res.json({ issues });
  } catch (err: any) {
    const errorResponse = buildErrorResponse(err);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
});

app.post('/rally/fetch-issues', async (req: Request, res: Response) => {
  try {
    const issues = await fetchRallyIssues(req.body);
    res.json({ issues });
  } catch (err: any) {
    const errorResponse = buildErrorResponse(err);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
});

app.post('/llm/test-connection', async (req: Request, res: Response) => {
  try {
    const result = await testLlmConnection(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/generate-test-plan', async (req: Request, res: Response) => {
  try {
    const plan = await generateTestPlan(req.body);
    res.json(plan);
  } catch (err: any) {
    const errorResponse = axios.isAxiosError(err)
      ? {
          error: typeof err.response?.data === 'string'
            ? err.response?.data
            : err.response?.data?.error || JSON.stringify(err.response?.data) || err.message,
          status: err.response?.status,
          url: err.config?.url,
          method: err.config?.method,
        }
      : { error: String(err) };
    res.status(errorResponse.status || 500).json(errorResponse);
  }
});

if (!process.env.VERCEL) {
  const port = Number(PORT);
  app.listen(port, () => console.log(`Backend listening on port ${port}`));
}

export default app;
