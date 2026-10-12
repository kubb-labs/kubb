---
'@kubb/mcp': patch
---

Validate MCP tool arguments with Zod Mini instead of valibot, so Kubb uses one validation library. Tool input schemas stay the same. Invalid arguments now return Zod's error messages, such as `Too small: expected string to have >=1 characters`.
