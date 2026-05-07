# GLADYS Phase 3 Spec (v1)

## Purpose

GLADYS is the AI explanation layer inside Token Intel.

It does **not** replace the deterministic intelligence engine. Instead, it sits on top of it and translates structured token analysis into clearer, more human guidance.

In short:
- Token Intel computes the facts
- GLADYS explains what the facts mean

---

## 1. What GLADYS is in Token Intel

GLADYS is a **guided explanation engine** for token research results.

### GLADYS v1 role
GLADYS v1 should help users:
- understand the token in plain English
- understand why risk is low / elevated / high
- understand how much confidence to place in the current result
- interpret mixed-signal or DEX-only cases more safely
- know what to double-check next

### GLADYS is not yet
- a full chatbot-first interface
- an open-ended assistant replacing the dashboard
- a trade recommendation engine
- a wallet execution agent

### Product stance
GLADYS should sound like:
- intelligent
- calm
- practical
- caution-aware
- beginner-friendly without becoming vague

---

## 2. Where GLADYS appears in the UI

### GLADYS v1 placement
GLADYS appears as a dedicated **GLADYS Insight Card** in single-token mode.

### Recommended placement
Render it inside the main dashboard grid:
- after `SignalCard`
- before `ResearchCard` / `SectorCard`

Reason:
- market + risk + signals establish the structured facts first
- GLADYS then interprets them
- research brief and sector context can still serve as supporting reference below

### Future UI expansion (not v1)
Possible later additions:
- Ask GLADYS expandable chat panel
- Compare-mode GLADYS verdicts
- beginner / advanced explanation modes
- premium “why this matters” narratives

---

## 3. Structured data GLADYS receives

GLADYS v1 should consume a structured explanation payload derived from the current `ResearchResponse`.

### Input contract (conceptual)
```ts
{
  token: {
    name: string | null;
    symbol: string | null;
    source: 'coingecko' | 'dexscreener' | 'local';
    confidence: 'high' | 'medium' | 'low';
  };
  market: {
    priceUsd: number | null;
    marketCapUsd: number | null;
    fullyDilutedValuationUsd: number | null;
    volume24hUsd: number | null;
    liquidityUsd: number | null;
    change24hPct: number | null;
    marketCapRank: number | null;
  };
  risk: {
    level: 'low' | 'medium' | 'high' | 'unknown';
    band: 'lower' | 'elevated' | 'high' | 'unknown';
    score: number | null;
    summaryMode: string;
    dominantDriver: string | null;
    overrideReason: string | null;
    flags: string[];
    honeypot: boolean | null;
    trustLabel: 'safe' | 'warning' | 'danger' | null;
    trustScore: number | null;
    liquidityRisk: 'low' | 'medium' | 'high' | null;
    volumeAnomaly: boolean | null;
    ageRisk: 'low' | 'medium' | 'high' | null;
  };
  signalInterpretation: {
    tone: 'positive' | 'caution' | 'negative' | 'neutral';
    summary: string | null;
    signals: Array<{
      key: string;
      label: string;
      detail: string;
      tone: 'positive' | 'caution' | 'negative' | 'neutral';
    }>;
  };
  researchBrief: {
    headline: string | null;
    body: string | null;
  };
  sector: string | null;
  fallback: {
    used: boolean;
    reason: string;
  };
}
```

### GLADYS v1 source of truth
For v1, this data can be assembled client-side from the already-rendered response.

That gives us:
- zero API shape breakage
- fast implementation
- clean upgrade path later when OpenAI-backed generation is added

---

## 4. Structured explanation GLADYS returns

GLADYS should return a structured explanation object rather than freeform text only.

### Output contract (v1)
```ts
{
  headline: string;
  summary: string;
  riskCall: string;
  confidenceNote: string;
  actionNote: string;
  tone: 'positive' | 'caution' | 'negative' | 'neutral';
  bullets: string[];
}
```

### Field meanings
- `headline` → short top-line framing
- `summary` → plain-English explanation of the setup
- `riskCall` → the main reason risk reads the way it does
- `confidenceNote` → how much trust to place in this output
- `actionNote` → what the user should verify or keep in mind next
- `tone` → controls UI badge styling
- `bullets` → concise supporting takeaways

### Example behavior
- Stable CoinGecko token:
  - calm summary
  - strong confidence note
  - monitor broader market conditions
- DEX-only calm token:
  - “visible setup looks calm”
  - limited-confidence note
  - verify contract and liquidity manually
- Honeypot-positive token:
  - severe warning
  - confidence anchored on exit-risk checks
  - strong do-not-trust-normal-exit language

---

## 5. GLADYS v1 implementation approach

### Implementation principle
GLADYS v1 should be implemented as a **deterministic explanation adapter** first.

Why:
- fast to ship
- easy to validate
- preserves trust
- avoids premature OpenAI coupling while power / API / quota conditions are unstable
- creates the exact contract OpenAI generation can later plug into

### v1 architecture
1. Build `buildGladysInput(response)` adapter
2. Build `generateGladysInsight(input)` deterministic summarizer
3. Render via `GladysInsightCard`
4. Add safe fallback behavior for incomplete data

### v1 fallback behavior
If data is weak / incomplete:
- GLADYS still renders
- tone becomes neutral
- explanation becomes limited-confidence language
- user is told the snapshot is incomplete

---

## 6. Why this is the right Phase 3 start

This gives Token Intel:
- a real GLADYS surface in the product
- a clean explanation contract
- no backend disruption
- a future bridge to OpenAI-backed narrative generation

It also keeps the product honest:
- deterministic engine stays authoritative
- GLADYS adds interpretation, not fabricated certainty

---

## 7. Post-v1 expansion path

After GLADYS v1 is stable, next upgrades can include:
- OpenAI-backed richer summaries
- beginner vs advanced explanation modes
- compare-mode GLADYS verdict engine
- “what changed” narratives
- premium guided research flows
- ask-GLADYS conversational layer
