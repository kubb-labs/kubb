---
"@kubb/cli": patch
"@kubb/mcp": patch
---

Telemetry now shows who ran a command. `kubb.tty` is `true` when a terminal is attached to stdin, which usually means a person typed the command. `kubb mcp` also reports the name of the MCP client that connected, such as `claude-code` or `cursor-vscode`, and sends its event when that client connects instead of at server start. `startServer` in `@kubb/mcp` now returns the server.
