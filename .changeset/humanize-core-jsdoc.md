---
"@kubb/adapter-oas": patch
"@kubb/cli": patch
"@kubb/core": patch
"@kubb/parser-md": patch
"@kubb/parser-ts": patch
"@kubb/plugin-barrel": patch
"@kubb/renderer-jsx": patch
"kubb": patch
---

Tighten the JSDoc prose across the core packages so the published types read naturally. This cuts rule-of-three filler, `-ing`-participle clauses, clause-joining semicolons, marketing words, and sentences that only restate the TypeScript type. The change is comment-only, so no API or behavior changes.
