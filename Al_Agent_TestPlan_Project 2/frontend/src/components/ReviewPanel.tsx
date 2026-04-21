import axios from 'axios';
import React, { useState } from 'react';
import { IssuePayload, PlanPreview } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const ReviewPanel: React.FC<{
  issues: IssuePayload[];
  context: string;
  provider: 'ollama' | 'openai' | 'grok' | 'lmstudio';
  model: 'mistral:7b' | 'llama3:latest' | 'qwen3:4b';
  apiKey: string;
  endpoint: string;
  onGenerate: (plan: PlanPreview) => void;
  onNext: () => void;
}> = ({ issues, context, provider, model, apiKey, endpoint, onGenerate, onNext }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setStatus('Generating test plan...');
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-test-plan`, {
        provider,
        model,
        apiKey: apiKey || undefined,
        endpoint: endpoint || undefined,
        context,
        issues,
        templateName: 'Restful Booker ATB12x',
      });
      onGenerate(response.data);
      setStatus('Generated test plan preview successfully.');
      onNext();
    } catch (err: any) {
      setStatus('Generation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="panel-title">Review Issues</h2>
      <p>Review fetched Jira or Rally issues before generating the test plan.</p>

      <div className="issue-list">
        {issues.length === 0 ? (
          <p>No issues fetched yet.</p>
        ) : (
          issues.map(issue => (
            <div key={issue.issueId} className="issue-card">
              <h3 className="issue-title">{issue.issueId}: {issue.summary}</h3>
              <p className="issue-meta">Type: {issue.type} • Priority: {issue.priority}</p>
            </div>
          ))
        )}
      </div>

      <div className="button-row">
        <button type="button" className="button-primary" onClick={handleGenerate} disabled={loading || issues.length === 0}>
          {loading ? 'Generating...' : 'Generate Test Plan'}
        </button>
      </div>

      {status && <p style={{ marginTop: 16, color: '#334155' }}>{status}</p>}
    </div>
  );
};
