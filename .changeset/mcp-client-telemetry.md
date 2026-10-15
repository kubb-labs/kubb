---
"@kubb/cli": minor
"@kubb/mcp": minor
---

`kubb mcp` telemetry now names the MCP client that connected, such as `claude-code` or `cursor-vscode`. The event is sent when the client connects instead of at server start. `startServer` in `@kubb/mcp` now returns the server.
