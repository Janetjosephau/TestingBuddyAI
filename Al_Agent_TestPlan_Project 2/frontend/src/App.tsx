import React, { useState } from 'react';
import { SetupPanel } from './components/SetupPanel';
import { FetchIssuesPanel } from './components/FetchIssuesPanel';
import { ReviewPanel } from './components/ReviewPanel';
import { TestPlanPanel } from './components/TestPlanPanel';
import { IssuePayload, PlanPreview } from './types';

const steps = ['Setup', 'Fetch', 'Review', 'Test Plan'] as const;

type Step = (typeof steps)[number];

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>('Setup');
  const [connectionType, setConnectionType] = useState<'jira' | 'rally'>('jira');
  const [connectionDetails, setConnectionDetails] = useState<Record<string, string>>({});
  const [llmProvider, setLlmProvider] = useState<'ollama' | 'openai' | 'grok' | 'lmstudio'>('ollama');
  const [llmModel, setLlmModel] = useState<'mistral:7b' | 'llama3:latest' | 'qwen3:4b'>('llama3:latest');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmEndpoint, setLlmEndpoint] = useState('');
  const [issues, setIssues] = useState<IssuePayload[]>([]);
  const [context, setContext] = useState('');
  const [planPreview, setPlanPreview] = useState<PlanPreview | null>(null);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Intelligent Test Planning Agent</h1>
          <p>Generate comprehensive test plans from Jira or Rally requirements using AI.</p>
        </div>
      </header>

      <div className="stepper">
        {steps.map(step => (
          <button
            key={step}
            type="button"
            className={`step-button ${step === currentStep ? 'active' : ''}`}
            onClick={() => setCurrentStep(step)}
          >
            {step}
          </button>
        ))}
      </div>

      <main className="content-card">
        {currentStep === 'Setup' && (
          <SetupPanel
            connectionType={connectionType}
            setConnectionType={setConnectionType}
            connectionDetails={connectionDetails}
            setConnectionDetails={setConnectionDetails}
            llmProvider={llmProvider}
            setLlmProvider={setLlmProvider}
            llmModel={llmModel}
            setLlmModel={setLlmModel}
            llmApiKey={llmApiKey}
            setLlmApiKey={setLlmApiKey}
            llmEndpoint={llmEndpoint}
            setLlmEndpoint={setLlmEndpoint}
            onNext={() => setCurrentStep('Fetch')}
          />
        )}
        {currentStep === 'Fetch' && (
          <FetchIssuesPanel
            connectionType={connectionType}
            connectionDetails={connectionDetails}
            context={context}
            setContext={setContext}
            onFetch={setIssues}
            onNext={() => setCurrentStep('Review')}
          />
        )}
        {currentStep === 'Review' && (
          <ReviewPanel
            issues={issues}
            context={context}
            provider={llmProvider}
            model={llmModel}
            apiKey={llmApiKey}
            endpoint={llmEndpoint}
            onGenerate={setPlanPreview}
            onNext={() => setCurrentStep('Test Plan')}
          />
        )}
        {currentStep === 'Test Plan' && (
          <TestPlanPanel planPreview={planPreview} />
        )}
      </main>
    </div>
  );
}
