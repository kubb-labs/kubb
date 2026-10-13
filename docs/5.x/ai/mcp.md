---
layout: doc
title: Set up the MCP server
description: Connect AI editors and agents to Kubb's local MCP server. Configure
  Claude Code, Claude Desktop, Cursor, VS Code, and other MCP-capable clients to
  run Kubb tools directly.
outline:
  - 2
  - 3
order: 3
navigation:
  title: MCP
  icon: i-simple-icons-modelcontextprotocol
---

# Set up the MCP server

Kubb ships a [Model Context Protocol](https://modelcontextprotocol.io/) server with three tools:
`generate`, `validate`, and `init`. Connect it to your editor or agent to validate a spec, scaffold
a `kubb.config.ts`, and run generation from the chat.

> [!NOTE]
> This page covers using Kubb tooling inside your editor over MCP. To generate an MCP server from
> your OpenAPI spec, see [`@kubb/plugin-mcp`](/extensions/kubb-labs/plugin-mcp) instead.

## Client configuration {#client-configuration}

Each client below starts the server with `npx kubb mcp` over stdio. The [command reference](/docs/5.x/reference/commands/mcp#tools) lists each tool's parameters.

### Claude Code

Run this from your project root, so the server starts next to your `kubb.config.ts`:

```shell [Terminal]
claude mcp add kubb -- npx kubb mcp
```

Add `--scope project` to write the entry to `.mcp.json` and share it with your team. The [Kubb Claude Code plugin](/docs/5.x/ai/claude) registers the same server for you.

### Claude Desktop and Cursor

Add the entry to `claude_desktop_config.json` (on macOS under `~/Library/Application Support/Claude/`, on Windows under `%APPDATA%\Claude\`) or to the server list under Cursor's `Settings → MCP`.

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

### VS Code (GitHub Copilot)

VS Code uses a `servers` key instead. Add this to `.vscode/mcp.json` for the workspace, or run `MCP: Open User Configuration` in the Command Palette for a global setup.

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

## Working directory {#working-directory}

The server looks for `kubb.config.*` in the folder the client starts it in, and rejects a `config` path outside that folder. Claude Code starts it in the folder you run `claude` from.

If `generate` returns `No config file found`, the client started the server in another folder. Clients such as Claude Code ignore a `cwd` key, so change into the project in the command instead (macOS and Linux):

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
