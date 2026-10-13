---
'@kubb/cli': patch
---

Keep `kubb mcp` stdout free of the CLI header, so MCP clients receive only JSON-RPC messages. The header line and the blank line after it broke the MCP stdio rule that stdout carries only protocol messages.
