# Token Intel
## System Overview

**Version:** v1.2
**Status:** Active Development
**Current Phase:** Phase 3 — GLADYS (AI Intelligence Layer)

---

## 1. Product Summary

Token Intel is a web-based crypto research and comparison tool designed to help users understand digital assets through structured, deterministic market intelligence rather than speculative hype or scattered information.

It enables users to search for a single token or project and compare two tokens side by side through market structure, risk, sector context, trust signals, and signal interpretation in one place.

The goal is to make crypto research clearer, faster, and more accessible, especially for users who need simple but meaningful intelligence.

---

## 2. Problem

Many crypto users rely on fragmented information sources such as:
- Social media posts
- Influencer opinions
- Exchange dashboards
- Random websites

This makes it difficult to:
- Understand what a token actually does
- Compare projects in a structured way
- Assess risk quickly
- Judge whether a token is merely volatile or structurally unsafe

As a result, decision-making is often:
- Reactive
- Emotional
- Based on incomplete data
- Overconfident in low-context situations

---

## 3. Solution

Token Intel solves this by turning live market and trust-layer data into structured, readable research output.

Instead of showing only raw numbers, the system organizes token analysis into clear layers such as:
- Market snapshot
- Research brief
- Sector tagging and sector context
- Risk analysis
- Signal interpretation
- Strengths vs risks framing
- Side-by-side compare mode

This makes the product useful for:
- Beginners who need understandable summaries
- Researchers who want quick structured comparisons
- Community educators who need simple explanations
- Traders and evaluators who need better risk context for DEX-only or newly launched assets

The system prioritizes clarity and determinism over black-box AI outputs, ensuring users can understand how conclusions are derived.

**The system is designed to function independently of AI, with AI acting as an enhancement layer rather than a dependency.**

---

## 4. Current Core Features

### Single Token Mode
Users can enter one token or project name and receive:
- Identity and source status
- Research brief / sector context
- Sector intelligence
- Live market snapshot
- Market risk snapshot
- Signal interpretation
- Strengths & risks summary
- Official links
- Last updated time

### Compare Mode
Users can enter two tokens and receive:
- Identity and source comparison
- Research brief comparison
- Sector comparison
- Sector intelligence comparison
- Market snapshot comparison
- Risk comparison
- Signal interpretation comparison
- Project basics
- Official links
- Data freshness

### Additional Features
- Fallback support (graceful degradation when data fails)
- CoinGecko-first resolution
- DEX fallback coverage for unsupported / newly deployed contracts
- Dark / Light theme support

---

## 5. System Architecture and Intelligence Layers

### Layer 1 — Data Ingestion
- Live token and project data pulled via research resolver
- CoinGecko as primary source
- DEXScreener as fallback source for DEX-only and newly deployed tokens
- Safe fallback path preserved for unresolved tokens

### Layer 2 — Market Structuring
Raw data normalized into:
- Price (24h change)
- Market cap
- Volume (24h)
- FDV
- Rank
- Liquidity
- Last updated

### Layer 3 — Risk Engine
Generates:
- Risk level
- Risk score
- Risk band
- Dominant driver
- Short risk summary

### Layer 4 — Signal Interpretation
Converts indicators into:
- Liquidity signal
- Volatility signal
- Market-cap signal
- FDV-gap signal
- Summary tone for decision support

### Layer 5 — Research Brief
Deterministic explanation of:
- What the project is
- Market posture
- Key watchouts

### Layer 6A — Sector Tagging
Maps tokens into:
- Layer 1
- DeFi
- AI
- Infrastructure
- NFT / Gaming
- Meme
- Stablecoin
- Exchange
- Unknown

### Layer 6B — Sector Intelligence
Each sector includes:
- Profile
- Watchouts

### Layer 7A — Comparative Intelligence
Compares:
- Liquidity
- Market size
- Short-term stability

### Layer 7B — Trust & Risk UX Layer
Adds:
- Honeypot detection context
- Liquidity depth analysis
- Volume anomaly checks
- Contract age risk
- Trade tax visibility
- DEX-specific warnings
- Human-readable risk posture and breakdown

### Layer 8 — Premium Dashboard UX
Provides:
- Modular intelligence cards
- Visual risk scoring
- Expandable trust breakdowns
- Structured strengths vs risks presentation
- Improved fallback and verification messaging

---

## 6. What Has Been Completed

### Core System
- Core web app built (React + TypeScript + Vite)
- Deployed on Vercel
- GitHub repo structured and polished
- README upgraded with stronger presentation and product framing
- System Overview document completed and updated

### Intelligence Layers Implemented
- Market Snapshot
- Research Engine
- Sector Context
- Risk Analysis
- Signal Interpretation
- Comparison Engine
- Trust & Risk UX layer
- DEX fallback intelligence layer

### Backend Capabilities
- CoinGecko API fully integrated
- Supports:
  - Token names
  - Token symbols
  - Contract addresses

---

## 6A. Phase 1 — Contract Engine ✅ Completed

### Implemented
- Contract address detection implemented via:
  - `^0x[a-fA-F0-9]{40}$`
- Multi-chain contract support added for:
  - ethereum
  - binance-smart-chain
  - polygon-pos
  - arbitrum-one
  - avalanche
- CoinGecko contract lookup path integrated:
  - `/coins/{chain}/contract/{address}`

### Engine Behavior
- Lowercase normalization
- Sequential multi-chain resolution
- First-match return strategy
- Safe fallback preserved when no supported match is found

### Outcome
- Contract-based research became a first-class capability instead of a symbol/name-only flow

---

## 6B. Phase 2 — DEX Intelligence Layer ✅ Completed

### Goal Achieved
Expanded coverage beyond CoinGecko to support:
- DEX-only tokens
- Newly deployed contracts
- Unlisted assets

### Implemented
- DEXScreener integrated as fallback source
- Fallback flow implemented:

Contract Input
↓
CoinGecko (multi-chain)
↓
IF FAIL
↓
DEXScreener
↓
Return normalized intelligence

- DEX data normalized into the existing response pipeline
- Existing response structure preserved
- CoinGecko behavior preserved
- Unknown-token fallback preserved
- Regression checks performed

### Outcome
- CoinGecko tokens → unchanged
- DEX tokens → supported
- Unknown tokens → fallback preserved

---

## 6C. Phase 2.1 — Trust & Risk Layer ✅ Implemented / Refined

### Goal Achieved
Token Intel now behaves much more like a risk-aware decision engine instead of a raw market-data viewer.

### Backend Trust / Risk Capabilities Implemented
- Honeypot detection integrated via `honeypot.is`
- Added trust / risk signals for:
  - liquidity depth analysis
  - volume anomaly detection
  - contract age risk
  - trade tax visibility
  - suspicious activity / trust-layer warnings
- Introduced trust / risk fields:
  - `risk.score`
  - `risk.level`
  - `risk.flags`
  - `risk.details`
  - `trustScore`
  - `trustLabel`
- Added DEX-specific warnings and heuristic disclaimers
- Added trust-layer enrichment without changing the overall API shape

### Frontend Trust / Risk UX Completed
- `RiskCard` heavily upgraded with:
  - circular score visualization
  - overall risk score display
  - lower risk / elevated risk / high risk posture badge
  - human-readable summary
  - trust-driver explanation
  - expandable risk breakdown
  - DEX warning banner
  - disclaimer layer
- `StrengthsRisksCard` refined with:
  - mixed-signal interpretation
  - suppression of weak positives when stronger risks dominate
  - deduplication of repetitive risk statements
  - volatility guardrails for contradictory output
- Coherence fixes completed:
  - removed danger-with-no-visible-flags contradiction
  - reduced repetitive backend summary noise
  - improved DEX vs CoinGecko differentiation
  - tightened score-to-label consistency
  - strengthened honeypot exit-risk wording
  - softened DEX-only low-risk wording to avoid false confidence

### Outcome
- Users can evaluate tokens with much better structural risk context
- DEX and CoinGecko flows now feel intentionally different
- Product credibility improved significantly
- Monetization foundation is much stronger than before

---

## 6D. Frontend / UI Upgrade ✅ Completed

- Converted the UI into a premium intelligence dashboard
- Modular component architecture includes:
  - SearchBar
  - MarketCard
  - RiskCard
  - SignalCard
  - ResearchCard
  - SectorCard
  - StrengthsRisksCard
- Features include:
  - card-based layout
  - skeleton loading states
  - fallback indicators
  - fixed comparison layout
  - decision-oriented risk visualization
  - theme system retained

---

## 6E. Visual Identity Upgrade ✅ Completed

- Applied black-and-gold dark theme styling
- Updated:
  - dark theme palette
  - accent colors
  - buttons
  - borders
  - focus states
  - highlight surfaces
- Preserved:
  - fonts
  - spacing
  - layout
  - logic
  - component architecture

### Branding
- Renamed product to **Token Intel**
- Updated:
  - app title
  - UI branding
  - README
  - docs
- Preserved:
  - repo structure
  - API routes
  - backend logic

---

## 7. Current Limitations

- Trust / risk scoring is much stronger now, but calibration may still need refinement in edge CoinGecko cases
- DEX fallback currently depends on DEXScreener only
- No Dextools integration yet
- GLADYS v1 is currently deterministic and rule-based rather than OpenAI-backed
- GLADYS is currently implemented in single-token mode only; compare-mode verdicts are not yet live
- No historical risk tracking yet
- No wallet-behavior / smart-money / on-chain event intelligence yet

---

## 8. Active Development Phase

The project is now in **Phase 3 — GLADYS (AI Intelligence Layer)**.

### Current Phase 3 Status
Phase 3 has already **started**.

A first-pass **GLADYS v1** layer is already implemented as a deterministic explanation surface in single-token mode.

Implemented so far:
- dedicated `GladysInsightCard` UI in the main dashboard
- deterministic `buildGladysInput(response)` adapter
- deterministic `generateGladysInsight(input)` summarizer
- live rendering for:
  - headline
  - summary
  - biggest concern
  - confidence note
  - next move
  - supporting bullets
- styling and UX treatment for GLADYS insight presentation

### Goal
Evolve GLADYS from a deterministic explanation layer into a richer intelligence layer without weakening the existing trust model.

### Next Phase 3 Tasks
- Integrate OpenAI (Codex / GPT models) behind the existing GLADYS contract
- Enable:
  - AI-generated summaries
  - richer risk explanations
  - simplified insights
  - beginner-friendly interpretation
  - guided explanation for mixed-signal tokens
- Extend GLADYS into compare mode with structured verdicts
- Preserve the current deterministic fallback path when AI is unavailable

### Expected Outcome
- Human-like explanations
- Beginner-friendly UX
- Higher perceived value
- Better conversion into a premium intelligence product
- Safer continuity because deterministic GLADYS still works when AI is unavailable

---

## 9. Near-Term Roadmap

### Phase 3 Priorities
- Validate and refine the current GLADYS v1 deterministic outputs across clean, elevated, honeypot, fragile, and DEX-only cases
- Keep the current deterministic-vs-AI boundary clear: structured facts from the engine, explanation from GLADYS
- Integrate OpenAI behind the existing GLADYS surface without breaking current deterministic outputs
- Preserve the current response structure while enriching user-facing insight quality
- Add compare-mode GLADYS verdicts after single-token GLADYS quality is considered stable

### Next Intelligence Expansion After Phase 3
- Comparative verdict engine
- Narrative intelligence
- User intent modes
- Monetization layer
- Agent automation

---

## 10. Long-Term Vision

Build a lightweight crypto intelligence platform that:
- Simplifies decision-making
- Reduces misinformation
- Scales globally

### Expansion Paths
- Web application
- Premium SaaS tool
- Education dashboard
- API product
- Telegram assistant
- Programmable research layer for Web3 apps

---

## 11. Why This Product Matters

This product reduces confusion in crypto research.

It helps users understand:
- What a token is
- Where it sits in the market
- What risks exist
- How it compares
- Whether visible calm should still be treated cautiously

It becomes a foundation for:
- Education
- Research
- Decision-making
- Premium intelligence workflows
