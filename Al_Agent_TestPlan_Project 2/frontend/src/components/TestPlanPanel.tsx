import React from 'react';
import { PlanPreview } from '../types';

export const TestPlanPanel: React.FC<{ planPreview: PlanPreview | null }> = ({ planPreview }) => {
  if (!planPreview) {
    return (
      <div>
        <h2 className="panel-title">Test Plan</h2>
        <p>No test plan generated yet. Complete the previous steps to generate your test plan.</p>
      </div>
    );
  }

  const downloadPlan = () => {
    const blob = new Blob([JSON.stringify(planPreview, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test-plan-preview.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="panel-title">Generated Test Plan</h2>
      <p>Review the generated test plan preview below.</p>

      <div className="button-row">
        <button type="button" className="button-primary" onClick={downloadPlan}>
          Download Plan JSON
        </button>
      </div>

      <section className="plan-section">
        <h3>Overview</h3>
        <p>{planPreview.planPreview}</p>
      </section>

      {planPreview.templateSections.map(section => (
        <section key={section.title} className="plan-section">
          <h3>{section.title}</h3>
          <p>{section.content}</p>
        </section>
      ))}
    </div>
  );
};
