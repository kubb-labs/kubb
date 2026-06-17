---
'@kubb/mcp': patch
'@kubb/cli': patch
---

Serve the MCP server over stdio only and drop the HTTP transport.

Every local MCP client (Claude, Copilot, editors) launches the server as a subprocess and talks to it over stdio, so the HTTP transport and its `--port` and `--host` flags are removed along with the `@remix-run/node-fetch-server` and `@tmcp/transport-http` dependencies. `startServer()` no longer takes `port` or `host` options.
