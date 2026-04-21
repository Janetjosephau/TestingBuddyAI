import axios from 'axios';
import React, { useState } from 'react';
import { IssuePayload } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const FetchIssuesPanel: React.FC<{
  connectionType: 'jira' | 'rally';
  connectionDetails: Record<string, string>;
  context: string;
  setContext: (value: string) => void;
  onFetch: (issues: IssuePayload[]) => void;
  onNext: () => void;
}> = ({ connectionType, connectionDetails, context, setContext, onFetch, onNext }) => {
  const [issueId, setIssueId] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [sprintOrFix, setSprintOrFix] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    if (connectionType === 'jira' && !issueId.trim() && !projectKey.trim() && !sprintOrFix.trim()) {
      setStatus('Add Issue ID, Project Key, or Sprint/Fix Version for Jira fetch.');
      return;
    }

    setLoading(true);
    setStatus('Fetching issues...');
    try {
      const endpoint = connectionType === 'jira' ? 'jira/fetch-issues' : 'rally/fetch-issues';
      const response = await axios.post(`${API_BASE_URL}/${endpoint}`, {
        ...connectionDetails,
        issueId: issueId.trim() || undefined,
        projectKey: projectKey.trim() || undefined,
        sprintOrFixVersion: sprintOrFix.trim() || undefined,
        additionalContext: context || undefined,
      });
      onFetch(response.data.issues || []);
      setStatus(`Fetched ${response.data.issues?.length ?? 0} issues`);
      onNext();
    } catch (err: any) {
      setStatus('Fetch failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="panel-title">Fetch Requirements</h2>
      <p>Use your Jira or Rally connection to retrieve story information for the test plan.</p>

      <div className="field-group">
        <div>
          <label>Jira / Rally Issue ID</label>
          <input
            value={issueId}
            onChange={e => setIssueId(e.target.value)}
            placeholder="e.g., PROJ-123 or US123"
          />
        </div>
        <div>
          <label>Project Key</label>
          <input
            value={projectKey}
            onChange={e => setProjectKey(e.target.value)}
            placeholder="e.g., PROJ"
          />
        </div>
        <div>
          <label>Sprint / Fix Version (Optional)</label>
          <input
            value={sprintOrFix}
            onChange={e => setSprintOrFix(e.target.value)}
            placeholder="Sprint 15 or release name"
          />
        </div>
        <div>
          <label>Additional Context (Optional)</label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Add any extra information about the product, testing goals, or constraints..."
          />
        </div>
      </div>

      <div className="button-row">
        <button type="button" className="button-primary" onClick={handleFetch} disabled={loading}>
          {loading ? 'Fetching...' : 'Fetch Issues'}
        </button>
      </div>

      {status && <p style={{ marginTop: 16, color: '#334155' }}>{status}</p>}
    </div>
  );
};
