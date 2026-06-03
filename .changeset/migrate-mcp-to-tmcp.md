---
'@kubb/mcp': minor
'@kubb/cli': patch
---

`@kubb/mcp`: replace `@modelcontextprotocol/sdk` with `tmcp` for TypeScript inference from Zod schemas. Add `validate` and `init` MCP tools alongside the existing `generate` tool. Export `createMcpServer` for platform integration. Add HTTP transport via the `--port` flag.

`@kubb/cli`: add `--port` (`-p`) and `--host` options to the `mcp` command for HTTP MCP server mode (omit both for stdio).
