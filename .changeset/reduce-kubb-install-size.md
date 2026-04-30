---
"@kubb/cli": patch
"kubb": patch
---

Reduce default install size by moving `@kubb/agent` and `@kubb/mcp` to optional `peerDependencies`. The CLI never imports them at runtime — they expose their own `kubb-mcp` / agent entry points. Install them explicitly when needed:

```bash
npm i @kubb/mcp     # for the MCP server
npm i @kubb/agent   # for the HTTP agent
```
