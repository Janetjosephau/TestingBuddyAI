import axios from 'axios';
import React, { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const SetupPanel: React.FC<{
  connectionType: 'jira' | 'rally';
  setConnectionType: (value: 'jira' | 'rally') => void;
  connectionDetails: Record<string, string>;
  setConnectionDetails: (details: Record<string, string>) => void;
  llmProvider: 'ollama' | 'openai' | 'grok' | 'lmstudio';
  setLlmProvider: (value: 'ollama' | 'openai' | 'grok' | 'lmstudio') => void;
  llmModel: 'mistral:7b' | 'llama3:latest' | 'qwen3:4b';
  setLlmModel: (value: 'mistral:7b' | 'llama3:latest' | 'qwen3:4b') => void;
  llmApiKey: string;
  setLlmApiKey: (value: string) => void;
  llmEndpoint: string;
  setLlmEndpoint: (value: string) => void;
  onNext: () => void;
}> = ({ connectionType, setConnectionType, connectionDetails, setConnectionDetails, llmProvider, setLlmProvider, llmModel, setLlmModel, llmApiKey, setLlmApiKey, llmEndpoint, setLlmEndpoint, onNext }) => {
  const [status, setStatus] = useState('');
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    setStatus('Testing connection...');
    try {
      const endpoint = connectionType === 'jira' ? 'jira/test-connection' : 'rally/test-connection';
      const response = await axios.post(`${API_BASE_URL}/${endpoint}`, connectionDetails);
      setStatus(response.data.ok ? 'Connection successful' : 'Connection failed');
    } catch (err: any) {
      setStatus('Connection failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setTesting(false);
    }
  };

  const handleTestLlmConnection = async () => {
    setTesting(true);
    setStatus('Testing LLM connection...');
    try {
      const response = await axios.post(`${API_BASE_URL}/llm/test-connection`, {
        provider: llmProvider,
        model: llmProvider === 'ollama' ? llmModel : undefined,
        apiKey: llmApiKey || undefined,
        endpoint: llmEndpoint || undefined,
      });
      setStatus(
        response.data.ok
          ? `LLM connection successful${response.data.model ? ` (${response.data.model})` : ''}`
          : `LLM connection failed${response.data.message ? `: ${response.data.message}` : ''}`
      );
    } catch (err: any) {
      setStatus('LLM connection failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <h2 className="panel-title">Jira / Rally Connection</h2>
      <p>Select your connection type and enter runtime credentials. For Jira, use the base URL only, not a project or issue page link.</p>

      <div className="field-group">
        <label>Connection Type</label>
        <select value={connectionType} onChange={e => setConnectionType(e.target.value as 'jira' | 'rally')}>
          <option value="jira">Jira</option>
          <option value="rally">Rally</option>
        </select>
      </div>

      <div className="field-group">
        <div>
          <label>{connectionType === 'jira' ? 'Jira URL' : 'Rally URL'}</label>
          <input
            value={connectionDetails.url || ''}
            onChange={e => setConnectionDetails({ ...connectionDetails, url: e.target.value })}
            placeholder={connectionType === 'jira' ? 'https://yourcompany.atlassian.net' : 'https://rally1.rallydev.com'}
          />
        </div>

        {connectionType === 'jira' ? (
          <>
            <div>
              <label>Jira Email</label>
              <input
                value={connectionDetails.email || ''}
                onChange={e => setConnectionDetails({ ...connectionDetails, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label>API Token</label>
              <input
                type="password"
                value={connectionDetails.apiToken || ''}
                onChange={e => setConnectionDetails({ ...connectionDetails, apiToken: e.target.value })}
                placeholder="Jira API token"
              />
            </div>
          </>
        ) : (
          <div>
            <label>Rally API Key</label>
            <input
              type="password"
              value={connectionDetails.apiKey || ''}
              onChange={e => setConnectionDetails({ ...connectionDetails, apiKey: e.target.value })}
              placeholder="Rally API key"
            />
          </div>
        )}
      </div>

      <div className="field-group">
        <div>
          <label>LLM Provider</label>
          <select value={llmProvider} onChange={e => setLlmProvider(e.target.value as 'ollama' | 'openai' | 'grok' | 'lmstudio')}>
            <option value="ollama">Ollama</option>
            <option value="openai">OpenAI</option>
            <option value="grok">Grok</option>
            <option value="lmstudio">LM Studio</option>
          </select>
        </div>

        {llmProvider === 'ollama' && (
          <div>
            <label>Ollama Model</label>
            <select value={llmModel} onChange={e => setLlmModel(e.target.value as 'mistral:7b' | 'llama3:latest' | 'qwen3:4b')}>
              <option value="mistral:7b">mistral:7b</option>
              <option value="llama3:latest">llama3:latest</option>
              <option value="qwen3:4b">qwen3:4b</option>
            </select>
          </div>
        )}

        {llmProvider !== 'ollama' && (
          <>
            <div>
              <label>LLM API Key</label>
              <input
                type="password"
                value={llmApiKey}
                onChange={e => setLlmApiKey(e.target.value)}
                placeholder="Provider API key"
              />
            </div>
            <div>
              <label>LLM Endpoint</label>
              <input
                value={llmEndpoint}
                onChange={e => setLlmEndpoint(e.target.value)}
                placeholder="Optional provider endpoint"
              />
            </div>
          </>
        )}
      </div>

      <div className="button-row">
        <button type="button" className="button-primary" onClick={handleTestConnection} disabled={testing}>
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button type="button" className="button-secondary" onClick={handleTestLlmConnection} disabled={testing}>
          {testing ? 'Testing...' : 'Test LLM'}
        </button>
        <button type="button" className="button-secondary" onClick={onNext}>
          Continue to Fetch Issues
        </button>
      </div>

      {status && <p style={{ marginTop: 16, color: '#334155' }}>{status}</p>}
    </div>
  );
};
