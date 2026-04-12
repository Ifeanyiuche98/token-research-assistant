# Token Research Assistant  
## System Overview  

**Version:** v1.1  
**Status:** Active Development  

---

## 1. Product Summary

Token Research Assistant is a web-based crypto research and comparison tool designed to help users understand digital assets through structured, deterministic market intelligence rather than speculative hype or scattered information.

It enables users to search for a single token or project and compare two tokens side by side through reviewing market structure, risk, sector context, and signal interpretation all in one place.

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

As a result, decision-making is often:
- Reactive  
- Emotional  
- Based on incomplete data  

---

## 3. Solution

Token Research Assistant solves this by turning live market data into structured, readable research output.

Instead of showing only raw numbers, the system organizes token analysis into clear layers such as:
- Market snapshot  
- Research brief  
- Sector tagging  
- Sector intelligence  
- Risk analysis  
- Signal interpretation  
- Side-by-side compare mode  

This makes the product useful for:

- Beginners who need understandable summaries  
- Researchers who want quick structured comparisons  
- Community educators who need simple explanations  

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
- Dark / Light theme support  

---

## 5. System Architecture and Intelligence Layers

### Layer 1 — Data Ingestion
- Live token and project data pulled via research resolver  
- Fallback path available  

### Layer 2 — Market Structuring
Raw data normalized into:
- Price (24h change)  
- Market cap  
- Volume (24h)  
- FDV  
- Rank  
- Last updated  

### Layer 3 — Risk Engine
Generates:
- Risk level  
- Risk score  
- Short risk summary  

### Layer 4 — Signal Interpretation
Converts indicators into:
- Liquidity signal  
- Volatility signal  
- Market-cap signal  
- FDV-gap signal  

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

---

## 6. What Has Been Completed

- Single token flow  
- Compare mode  
- Live + fallback response flow  
- Market snapshot rendering  
- Market risk rendering  
- Signal interpretation rendering  
- Research brief rendering  
- Sector tagging  
- Sector intelligence  
- Dark / Light theme support  
- OpenClaw agent environment setup  
- Gateway initialization  
- Initial remote model integration attempt  
- Production-safe API updates  

---

## 6B. Infrastructure & Runtime Environment

The system operates in a hybrid local + remote execution environment.

### Architecture
- Frontend runs locally  
- Core logic runs locally  
- OpenClaw agent runs locally  
- AI model runs on external machine  

### Connectivity
- Secure access via Tailscale  

### Current Status
- Local environment: fully operational  
- Tailscale: installed and authenticated  
- Remote access: pending tailnet invite  

This architecture enables scaling beyond local hardware by leveraging remote compute.

---

## 7. Current Limitation

The system is fully functional at the product level, but lacks active AI model connectivity.

### Issue Summary
- OpenClaw gateway is running  
- Frontend is fully functional  
- Remote model is unreachable  

### Root Cause
- Model hosted externally (Pete’s system)  
- Requires Tailscale network access  

### Resulting Issues
- LLM request timeouts  
- DNS resolution failures  
- No fallback model  

### Resolution in Progress
- Tailscale configured locally  
- Awaiting tailnet access  

### Impact
- Product development continues  
- AI-assisted features temporarily unavailable  

---

## 8. Near-Term Roadmap

### Product Polish
- Improve helper text  
- Improve loading states  
- Enhance UI clarity  
- Reduce repetition  

### Intelligence Expansion (Layer 7B)
- Comparative verdict engine  
- Narrative intelligence  
- User intent modes  
- Monetization layer  
- Agent automation  

---

## 9. Long-Term Vision

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

## 10. Why This Product Matters

This product reduces confusion in crypto research.

It helps users understand:
- What a token is  
- Where it sits in the market  
- What risks exist  
- How it compares  

It becomes a foundation for:
- Education  
- Research  
- Decision-making  

---

## 11. Current Development Phase & System Status

The project is currently in the **Infrastructure Integration Phase**.

### Focus
- Connecting AI model layer  
- Stabilizing backend intelligence  

### Unlocks Next Phase
- Automated research generation  
- Dynamic reasoning  
- Agent workflows  

Next phase:
➡️ **Intelligence Expansion Phase**