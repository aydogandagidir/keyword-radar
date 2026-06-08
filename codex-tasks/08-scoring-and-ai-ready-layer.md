# Task 08 — Scoring and AI-Ready Layer

Create `packages/scoring`.

Implement deterministic MVP scoring:
- frequencyScore
- longTailScore
- marketplaceCoverageScore
- confidenceScore
- opportunityScore

Add interfaces:
- AiKeywordClusterer
- ListingSuggestionGenerator

Do not call paid AI APIs unless environment variable exists.

Acceptance criteria:
- Scoring tests pass.
- AI interfaces compile.
- UI can display basic score fields.
