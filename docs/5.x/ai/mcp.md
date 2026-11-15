---
layout: doc
title: Set up the MCP server
description: Connect Claude Code, Claude Desktop, Cursor, VS Code, and other MCP clients to the Kubb MCP server, and start it in your project folder.
outline:
  - 2
  - 3
order: 2
navigation:
  title: MCP
  icon: i-simple-icons-modelcontextprotocol
---

# Set up the MCP server

Connect your editor or agent to [`kubb mcp`](/docs/5.x/reference/commands/mcp), the Kubb [Model Context Protocol](https://modelcontextprotocol.io/) server. You can then validate a spec, scaffold a `kubb.config.ts`, and run generation from the chat. The [command reference](/docs/5.x/reference/commands/mcp#tools) lists the tools and their parameters.

> [!NOTE]
> This server runs Kubb inside your editor. To generate an MCP server from your own OpenAPI spec, use [`@kubb/plugin-mcp`](/extensions/kubb-labs/plugin-mcp) instead.

## Add the server to your client {#client-configuration}

Each client starts the server with `npx kubb mcp` over stdio.

::tabs

:::tabs-item{label="Claude Code"}

Run this from your project root, so the server starts next to your `kubb.config.ts`:

```shell [Terminal]
claude mcp add kubb -- npx kubb mcp
```

Add `--scope project` to write the entry to `.mcp.json` and share it with your team. The [Kubb Claude Code plugin](/docs/5.x/ai/claude) registers the same server for you.

:::

:::tabs-item{label="Claude Desktop and Cursor"}

Add the entry to `claude_desktop_config.json` (on macOS in `~/Library/Application Support/Claude/`, on Windows in `%APPDATA%\Claude\`) or to the server list in Cursor's `Settings → MCP`:

```json [claude_desktop_config.json]
{
  "mcpServers": {
    "kubb": {
      "command": "npx",
      "args": ["kubb", "mcp"]
    }
  }
}
```

:::

:::tabs-item{label="VS Code"}

VS Code (GitHub Copilot) uses a `servers` key. Add the entry to `.vscode/mcp.json` for the workspace, or run `MCP: Open User Configuration` from the Command Palette for every workspace:

```json [.vscode/mcp.json]
{
  "servers": {
    "kubb": {
      "command": "npx",
      "args": ["kubb", "mcp"]
    }
  }
}
```

:::

::

## Start it in your project {#working-directory}

The server looks for your config in the folder the client starts it in, then in each parent folder. Claude Code starts it in the folder you run `claude` from.

If `generate` returns `No config file found`, the client started the server somewhere else. Clients such as Claude Code ignore a `cwd` key, so change into the project in the command instead (macOS and Linux):

```json [claude_desktop_config.json]
{
  "mcpServers": {
    "kubb": {
      "command": "sh",
      "args": ["-c", "cd '/path/to/your/project' && npx kubb mcp"]
    }
  }
}
```

[Working directory](/docs/5.x/reference/commands/mcp#working-directory) lists what the server reads and writes there.
