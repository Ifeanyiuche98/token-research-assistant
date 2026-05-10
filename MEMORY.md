# MEMORY.md

## Ongoing project directions

### Token Research Assistant roadmap
- We are intentionally following the near-term roadmap recorded in `token-research-assistant/docs/system-overview.md`.
- Current roadmap priorities:
  - Product polish: improve helper text, improve loading states, enhance UI clarity, reduce repetition.
  - Intelligence expansion (Layer 7B): comparative verdict engine, narrative intelligence, user intent modes, monetization layer, agent automation.
- Added to memory on 2026-05-03 after Ifeanyi explicitly asked that the roadmap be remembered and followed.
- As of 2026-05-08, GLADYS Phase 3 has materially progressed beyond planning:
  - deterministic single-token GLADYS insight layer is implemented and validated,
  - compare-mode GLADYS verdict card is implemented and polished,
  - roadmap docs are aligned with the real Phase 3 state.
- Latest saved compare polish commit on 2026-05-08: `5a981f8` (`Polish GLADYS compare verdict copy`).
- Decision made on 2026-05-09: compare verdict logic should live in the shared compare response contract rather than remain UI-only.
- New resume point after that decision: strengthen compare heuristics on the shared contract path or add OpenAI-backed GLADYS v2 while keeping the shared deterministic verdict as fallback.
- As of 2026-05-09, compare heuristics have now been strengthened beyond simple win-counting: the shared deterministic verdict weighs risk severity, source confidence, limited-data penalties, and small-edge tie handling.
- Dedicated compare-verdict tests were added on 2026-05-09 to lock down severe-risk overrides, mixed-data tie behavior, and token-name reason rendering.
- Browser validation on 2026-05-09 confirmed the GLADYS compare card behaves correctly on severe-risk override and mixed-data tie edge cases.

### Working style preferences
- Ifeanyi explicitly wants step-by-step continuity captured in memory as work progresses so recovery after outages or unforeseen interruptions is easy.
- Preference recorded on 2026-05-08: log meaningful progress steps during active work, not just final outcomes.
- Added on 2026-05-10: after the compare polish pass, we should deliberately revisit the Token Research Assistant UI/UX direction and plan for a more professional top-tier experience, with strong theme decisions, better typography, readable color choices, and higher overall design polish before or alongside later product polish work.
