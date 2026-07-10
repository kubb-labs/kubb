---
'@kubb/mcp': patch
---

Discover `kubb.config.mjs` during config auto-discovery and report each config error once.

The `generate` tool searched every allowed config extension except `.mjs`, so a project whose only config was `kubb.config.mjs` was told no config existed unless it passed an explicit path. The tool also emitted `CONFIG_ERROR` a second time from its catch block after `loadUserConfig` had already reported it. Auto-discovery now includes `kubb.config.mjs` and each config error surfaces a single time.
