import axios from 'axios';
import { OLLAMA_URL, OPENAI_URL } from '../config';
import { GenerateTestPlanPayload, LlmTestPayload } from '../types';

const LLM_TIMEOUT_MS = 90000;
const MAX_LLM_TOKENS = 180;

function getOllamaBaseUrl(endpoint?: string) {
  return (endpoint || OLLAMA_URL)
    .replace(/\/v1\/chat\/completions$/, '')
    .replace(/\/v1\/models$/, '')
    .replace(/\/api\/chat$/, '')
    .replace(/\/+$/, '');
}

function buildPrompt(payload: GenerateTestPlanPayload) {
  const issueSummaries = payload.issues
    .slice(0, 5)
    .map(i => `${i.issueId}: ${i.summary}`)
    .join('; ');

  return `Return ONLY valid minified JSON. No markdown. No code fences. No intro text.

Create a compact test plan for: ${issueSummaries}

Use this exact shape:
{"planPreview":"one short sentence","sections":{"Overview":"one short sentence","Scope":"one short sentence","Test Approach":"one short sentence","Test Scenarios":"3 short numbered items in one string","Acceptance Criteria":"one short sentence","Coverage and Risk":"one short sentence","Assumptions":"one short sentence"}}`;
}

function extractJsonObject(content: string) {
  const cleaned = content.replace(/```json|```/gi, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function normalizePlanPreview(parsed: any, model: string) {
  if (typeof parsed.planPreview === 'string') {
    return parsed.planPreview;
  }

  if (parsed.planPreview?.description) {
    return parsed.planPreview.description;
  }

  if (parsed.planPreview?.name) {
    return parsed.planPreview.name;
  }

  return `Generated test plan preview using ${model}.`;
}

function normalizeTemplateSections(parsed: any) {
  const directSections = parsed.templateSections;
  const nestedSections = parsed.planPreview?.templateSections;
  const objectSections = parsed.sections;
  if (objectSections && typeof objectSections === 'object' && !Array.isArray(objectSections)) {
    return Object.entries(objectSections).map(([title, content]) => ({
      title,
      content: Array.isArray(content) ? content.join('\n') : String(content ?? ''),
    }));
  }

  const candidateSections = Array.isArray(directSections)
    ? directSections
    : Array.isArray(nestedSections)
      ? nestedSections
      : null;

  if (!candidateSections) {
    return null;
  }

  return candidateSections.map((section: any, index: number) => ({
    title: section.title || section.sectionTitle || section.name || `Section ${index + 1}`,
    content: Array.isArray(section.content)
      ? section.content.join('\n')
      : section.content || section.text || section.description || '',
  }));
}

function parsePlanResponse(content: string, payload: GenerateTestPlanPayload, model: string) {
  try {
    const jsonText = extractJsonObject(content);
    const parsed = JSON.parse(jsonText);
    const sections = normalizeTemplateSections(parsed);

    if (!sections) {
      throw new Error('Model response did not contain valid template sections.');
    }

    return {
      ...parsed,
      planPreview: normalizePlanPreview(parsed, model),
      templateSections: sections,
      issues: parsed.issues?.length ? parsed.issues : payload.issues,
    };
  } catch {
    throw new Error(`The selected model (${model}) returned content that could not be parsed into the required JSON test plan format.`);
  }
}

export async function testLlmConnection(payload: LlmTestPayload) {
  if (payload.provider === 'ollama') {
    const baseUrl = getOllamaBaseUrl(payload.endpoint);
    
    // Use Ollama's native API endpoint
    const modelsResponse = await axios.get(`${baseUrl}/api/tags`, { timeout: 15000 });
    const models = Array.isArray(modelsResponse.data?.models)
      ? modelsResponse.data.models.map((item: any) => item.name)
      : [];

    if (payload.model) {
      if (!models.includes(payload.model)) {
        return { ok: false, message: `Model ${payload.model} was not found in Ollama.`, models };
      }

      await axios.post(
        `${baseUrl}/api/chat`,
        {
          model: payload.model,
          messages: [{ role: 'user', content: 'Reply with OK only.' }],
          stream: false,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 20000,
        }
      );
    }

    return { ok: modelsResponse.status === 200, models, model: payload.model };
  }

  if (payload.provider === 'openai') {
    return { ok: Boolean(payload.apiKey) };
  }

  if (payload.provider === 'grok' || payload.provider === 'lmstudio') {
    return { ok: Boolean(payload.endpoint) };
  }

  return { ok: false };
}

export async function generateTestPlan(payload: GenerateTestPlanPayload) {
  const prompt = buildPrompt(payload);

  if (payload.provider === 'ollama') {
    const baseUrl = getOllamaBaseUrl(payload.endpoint);
    const endpoint = `${baseUrl}/api/chat`;
    const model = payload.model || 'llama3:latest';

    try {
      const response = await axios.post(
        endpoint,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          format: 'json',
          options: {
            temperature: 0,
            num_predict: MAX_LLM_TOKENS,
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: LLM_TIMEOUT_MS,
        }
      );

      const content = response.data?.message?.content;
      if (!content || !String(content).trim()) {
        throw new Error(`The selected model (${model}) returned no content.`);
      }

      return parsePlanResponse(content, payload, model);
    } catch (err) {
      if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
        throw new Error(`The selected model (${model}) timed out after ${LLM_TIMEOUT_MS / 1000} seconds. Try a smaller issue set or switch models.`);
      }

      throw err;
    }
  }

  if (payload.provider === 'openai' && payload.apiKey) {
    const endpoint = payload.endpoint || OPENAI_URL;
    const response = await axios.post(
      endpoint,
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: MAX_LLM_TOKENS,
        temperature: 0.2,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${payload.apiKey}`,
        },
        timeout: LLM_TIMEOUT_MS,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    try {
      return JSON.parse(content);
    } catch {
      return {
        planPreview: `Failed to parse LLM response; raw response saved.`,
        templateSections: [
          { title: 'Raw Output', content: content || 'No content returned.' },
        ],
        issues: payload.issues,
      };
    }
  }

  return {
    planPreview: `Generated test plan preview for ${payload.issues.length} issue(s).`,
    templateSections: [
      {
        title: 'Overview',
        content: 'This is a fallback preview. Configure an LLM provider to generate the full plan.',
      },
    ],
    issues: payload.issues,
  };
}
