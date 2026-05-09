---
'@kubb/mcp': minor
'@kubb/cli': patch
---

**@kubb/mcp**: Replace `@modelcontextprotocol/sdk` with `tmcp` for full TypeScript inference from Zod schemas. Add `validate` and `init` MCP tools alongside the existing `generate` tool. Export `createMcpServer` for platform integration. Add HTTP transport support via `--port` flag.

**@kubb/cli**: Add `--port` (`-p`) and `--host` options to the `mcp` command for HTTP MCP server mode (omit both for stdio).
