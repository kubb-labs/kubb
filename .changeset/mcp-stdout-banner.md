---
'@kubb/cli': patch
'@kubb/mcp': patch
---

Keep stdout clean for the MCP stdio transport: `kubb mcp` prints its startup banner on stderr, so the JSON-RPC stream no longer starts with a stray line. `@kubb/mcp` also declares `jiti` as a dependency instead of bundling its own copy.
