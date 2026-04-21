# Architecture

This folder contains project architecture artifacts for the intelligent test planner.

## Contents

- `gemini.md` — data schema, rules, and input/output contracts
- ` Blast Framework/B.L.A.S.T.md` — process guidance for planning and implementation
- `UIScreenshots/` — UI flow references for the app
- `TestPlan_Template/` — the test plan template to map generated output against

## Implementation Notes

- Build a runtime-only Jira/Rally connector flow.
- Keep API credentials in frontend state only for the current session.
- Use a preview-first output model before adding export/share capabilities.
