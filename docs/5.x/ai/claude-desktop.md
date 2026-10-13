---
layout: doc
title: Connect an API server to Claude Desktop
description: Add a generated Kubb MCP server to Claude Desktop so its tools can call your API.
outline: [2, 3]
order: 5
navigation:
  title: Your API in Claude Desktop
  icon: i-simple-icons-claude
---

# Connect an API server to Claude Desktop

Start with [Claude Desktop](https://claude.ai/download) installed and an MCP server generated from your API specification. Follow [Run an MCP server](/extensions/kubb-labs/plugin-mcp/guides/server) to configure generation, install runtime dependencies, and create a `server.ts` entry point that calls the generated `startServer` function.

::steps{level="2"}

## Register the server

Open Claude Desktop's `Settings → Developer → Edit Config`. This opens `claude_desktop_config.json`, the same file the [Kubb MCP server](/docs/5.x/ai/mcp#client-configuration) uses. Add the generated entry from `src/gen/mcp/.mcp.json` to the file's `mcpServers` object. Keep existing server entries. Update its command arguments to use the absolute path to your `server.ts` entry point:

```json [claude_desktop_config.json]
{
  "mcpServers": {
    "petstore": {
      "command": "npx",
      "args": ["--yes", "tsx", "/absolute/path/to/project/server.ts"]
    }
  }
}
```

Replace the example path with your project path. In Windows JSON paths, escape each backslash as `\\`.

## Use the generated tools

Quit Claude Desktop completely and reopen it. Open `Manage connectors`, select your server, and check that the tools match the operations in your specification. Ask Claude to run one of those operations and review its request before approving the API call.

::
