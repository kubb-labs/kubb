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

Start with [Claude Desktop](https://claude.ai/download) installed and an MCP server generated from your API specification. Follow [Run an MCP server](/extensions/kubb-labs/plugin-mcp/guides/server) to configure generation and install the runtime dependencies. Generation writes the `start.ts` entry point and a `.mcp.json` entry for it.

::steps{level="2"}

## Register the server

Open Claude Desktop's `Settings → Developer → Edit Config`. This opens `claude_desktop_config.json`, the same file the [Kubb MCP server](/docs/5.x/ai/mcp#client-configuration) uses. Add the generated entry from `src/gen/mcp/.mcp.json` to the file's `mcpServers` object. Keep existing server entries. Change the path in its `args` to the absolute path of the generated `start.ts`:

```json [claude_desktop_config.json]
{
  "mcpServers": {
    "Swagger PetStore - OpenAPI 3.0": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/project/src/gen/mcp/start.ts"]
    }
  }
}
```

Replace the example path with your project path. In Windows JSON paths, escape each backslash as `\\`.

## Use the generated tools

Quit Claude Desktop completely and reopen it. Open `Manage connectors`, select your server, and check that the tools match the operations in your specification. Ask Claude to run one of those operations and review its request before approving the API call.

::
