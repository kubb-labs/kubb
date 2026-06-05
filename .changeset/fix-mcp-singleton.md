---
'@kubb/plugin-mcp': patch
---

Generated MCP `server.ts` now exports `getServer()` and `startServer()` factories that build a fresh `McpServer` per call. The previous singleton was unusable for HTTP transports, where each session needs its own server instance ([#3481](https://github.com/kubb-labs/kubb/issues/3481)).
