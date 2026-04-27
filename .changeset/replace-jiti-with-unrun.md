---
"@kubb/agent": patch
"@kubb/cli": patch
"@kubb/mcp": patch
---

feat: replace jiti with unrun for TypeScript config loading

Swap `jiti` for `unrun` (powered by rolldown/Oxc) across the cli, agent, and mcp packages.
unrun is ~7× faster on first load (19ms vs 138ms) with a smaller overall package footprint.
