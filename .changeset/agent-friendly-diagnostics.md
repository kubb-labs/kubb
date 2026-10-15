---
'@kubb/core': patch
'@kubb/cli': patch
'@kubb/adapter-oas': patch
'@kubb/mcp': patch
'@kubb/studio': patch
'unplugin-kubb': patch
---

Diagnostics now say why a build failed and how to fix it, in a terminal layout for people and a plain layout for AI agents, CI, and `--reporter json`. A plugin listed twice in `plugins` now fails.
