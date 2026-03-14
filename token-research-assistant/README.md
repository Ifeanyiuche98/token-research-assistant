# token-research-assistant

A tiny TypeScript web app for generating short research notes about a token or crypto project.

## Goal

Keep phase 1 very small:

- enter a token or project name
- click **Generate note**
- show a short markdown-style note with:
  - summary
  - use case
  - risks
  - ecosystem notes

This version is optimized for a **first working demo**, not production complexity.

## Recommended Stack

- **Vite** — fast, simple dev setup
- **React** — easy component model for a small UI
- **TypeScript** — required, and keeps the code safer
- **Plain CSS** — enough for a clean first version

Why this stack?

- minimal setup
- beginner-friendly
- fast local development
- no unnecessary backend for phase 1

## MVP

### User flow

1. User enters a token or project name
2. User clicks **Generate note**
3. App returns a short research note in a clean output card

### Output sections

- **Summary**
- **Use Case**
- **Risks**
- **Ecosystem Notes**

## Suggested Phase 1 Scope

For the first demo, keep the generation logic simple:

- start with **mock data** or a local function
- optionally replace it later with a real API or LLM backend

That means the UI can be built and demoed quickly before adding external integrations.

## Project Structure

```text
token-research-assistant/
├─ public/
├─ src/
│  ├─ components/
│  │  ├─ TokenForm.tsx
│  │  ├─ ResearchNote.tsx
│  │  └─ LoadingState.tsx
│  ├─ types/
│  │  └─ research.ts
│  ├─ data/
│  │  └─ mockResearch.ts
│  ├─ utils/
│  │  └─ generateResearchNote.ts
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ styles.css
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.node.json
└─ vite.config.ts
```

## Main Pages and Components

### Pages

For phase 1, a **single-page app** is enough.

- **Home page**
  - token/project input
  - generate button
  - result display

### Components

- **TokenForm**
  - text input
  - submit button
- **ResearchNote**
  - displays the generated result
- **LoadingState**
  - simple loading message/spinner while generating

## Getting Started

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal.

## Next Steps After Phase 1

- connect the app to a real research API or LLM
- add input validation
- add error handling for failed requests
- support markdown rendering
- keep a small history of recent searches

## Notes

Phase 1 should stay intentionally small. The main win is getting a clean demo working end-to-end as fast as possible.
