# Gemini: Project Data Schema and Rules

## Project Scope
- Jira and Rally connectors
- Runtime-only connection credentials
- Fetch story/issue data by Jira ID or Rally ID
- Generate a test plan based on the provided template
- Preview-first output

## Input Schema

```json
{
  "connectionType": "jira | rally",
  "connectionDetails": {
    "url": "string",
    "usernameOrEmail": "string",
    "apiToken": "string"
  },
  "issueQuery": {
    "issueId": "string",
    "projectKey": "string",
    "sprintOrFixVersion": "string | null",
    "additionalContext": "string | null"
  },
  "llmProvider": "ollama | grok | openai | lmstudio"
}
```

## Normalized Issue Schema

```json
{
  "issueId": "string",
  "summary": "string",
  "description": "string",
  "acceptanceCriteria": "string[]",
  "type": "string",
  "priority": "string",
  "labels": "string[]",
  "customFields": {
    "[fieldName]": "string"
  }
}
```

## Output Schema

```json
{
  "planPreview": "string",
  "templateSections": [
    {
      "title": "string",
      "content": "string"
    }
  ],
  "issues": [/* normalized issue objects */]
}
```

## Rules
- Do not persist Jira/Rally credentials beyond the current session.
- Always verify connections before fetching issues.
- Use the attached test plan template to determine output sections.
- Prefer structured output from the LLM for predictable rendering.
