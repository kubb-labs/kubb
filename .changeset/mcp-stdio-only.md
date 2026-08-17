---
'@kubb/mcp': major
'@kubb/cli': patch
---

Migrate the MCP server to [tmcp](https://github.com/paoloricciuti/tmcp) and serve it over stdio only.

`tmcp` replaces `@modelcontextprotocol/sdk`, giving tool schemas TypeScript inference straight from their Zod definitions. Alongside the existing `generate` tool, the server now ships `validate` and `init` tools, and exports `createMcpServer` for embedding in other tooling.

Every local MCP client (Claude, Copilot, editors) launches the server as a subprocess and talks to it over stdio, so the HTTP transport and its `--port`/`--host` flags are gone, along with the `@remix-run/node-fetch-server` and `@tmcp/transport-http` dependencies. `startServer()` no longer takes `port` or `host` options.
