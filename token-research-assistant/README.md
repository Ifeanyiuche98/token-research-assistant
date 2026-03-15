# token-research-assistant

A lightweight frontend web app for generating short research notes about crypto tokens and projects.

The goal is to keep the project simple, beginner-friendly, and easy to deploy. A user enters a token or project name, clicks a button, and gets a short markdown-style note with the most important first-pass research points.

## Overview

This app is intentionally frontend-only for now.

It uses a small local research dataset plus a graceful fallback mode for unknown inputs. That makes it useful for demos without needing a backend, API keys, or external services.

## Stack

- **Vite**
- **React**
- **TypeScript**
- **Plain CSS**

Why this stack:

- fast local development
- simple project structure
- low setup complexity
- easy deployment to Vercel

## Current MVP Features

- search by token or project name
- generate a short research note with:
  - summary
  - use case
  - risks
  - ecosystem notes
- loading state while generating
- validation for empty input
- quick example chips for fast testing
- auto-submit when clicking a sample chip
- clear button to reset the form and result
- copy note button for easy sharing
- known dataset match vs fallback status badge
- welcoming empty state before first search

## Supported Built-in Projects

The local dataset currently includes:

- Bitcoin
- Ethereum
- Solana
- Chainlink
- Uniswap

Unknown inputs still return a cautious fallback research note.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open the local URL shown in the terminal.

## Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
token-research-assistant/
├─ public/
├─ src/
│  ├─ components/
│  │  ├─ LoadingState.tsx
│  │  ├─ ResearchNote.tsx
│  │  └─ TokenForm.tsx
│  ├─ data/
│  │  └─ mockResearch.ts
│  ├─ types/
│  │  └─ research.ts
│  ├─ utils/
│  │  └─ generateResearchNote.ts
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ styles.css
├─ index.html
├─ package.json
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
└─ README.md
```

## Vercel Deployment Notes

This project is a standard Vite static frontend, so it is a good fit for Vercel.

Typical Vercel settings:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

No backend setup is required for the current version.

## Status

The app is deployment-ready as a frontend-only Vercel project.

Future upgrades can add a real research API or AI generation layer, but the current version is intentionally small and demo-friendly.
