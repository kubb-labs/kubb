---
layout: doc

title: \@kubb/mcp
outline: deep
---

# @kubb/mcp

The `@kubb/mcp` package provides a [Model Context Protocol](https://modelcontextprotocol.io) server that exposes Kubb's code generation functionality to AI assistants like [Claude](https://claude.ai), [Cursor](https://cursor.sh), and other MCP-compatible clients.
This enables conversational code generation workflows where you can ask an AI to generate TypeScript types, API clients, and more from your OpenAPI specifications using natural language.

The MCP server acts as a bridge between MCP clients (like [Claude Desktop](https://claude.ai/download)) and Kubb's build system, allowing AI assistants to generate code from OpenAPI specs using your `kubb.config.ts`.

## Installation

Install the package as a dev dependency:

::: code-group
```shell [bun]
bun add -d @kubb/mcp @kubb/cli
```

```shell [pnpm]
pnpm add -D @kubb/mcp @kubb/cli
```

```shell [npm]
npm install --save-dev @kubb/mcp @kubb/cli
```

```shell [yarn]
yarn add -D @kubb/mcp @kubb/cli
```
:::

> [!IMPORTANT]
> Both `@kubb/mcp` and `@kubb/cli` are required if you want to run `kubb mcp`.
> You can also run `npx @kubb/mcp` without installing.

## Quick Start

### 1. Start the MCP Server

Start the server using the Kubb CLI:

```shell
npx kubb mcp
```

Or run it directly as a standalone package:

> [!IMPORTANT]
> Here you only need to install `@kubb/mcp` if you use this method.


```shell
npx @kubb/mcp
```

This starts an MCP server that communicates via stdio (standard input/output), making it compatible with MCP clients.

> [!TIP]
> The server runs in the foreground and waits for requests from MCP clients. Leave it running while you interact with your AI assistant.

### 2. Configure Your MCP Client

Add Kubb to your MCP client's configuration file.

**For Claude Desktop:**

Add to `claude_desktop_config.json` (location varies by OS):

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Option 1: Using Kubb CLI (recommended):**
```json
{
  "mcpServers": {
    "kubb": {
      "command": "npx",
      "args": ["kubb", "mcp"]
    }
  }
}
```

**Option 2: Using standalone bin:**
```json
{
  "mcpServers": {
    "kubb": {
      "command": "npx",
      "args": ["@kubb/mcp"]
    }
  }
}
```

**For project-specific configurations:**

If you have multiple projects with different Kubb configurations, specify the working directory:

```json
{
  "mcpServers": {
    "kubb-petstore": {
      "command": "npx",
      "args": ["@kubb/mcp"],
      "cwd": "/path/to/your/petstore-project"
    },
    "kubb-api": {
      "command": "npx",
      "args": ["@kubb/mcp"],
      "cwd": "/path/to/your/api-project"
    }
  }
}
```

### 3. Create a kubb.config.ts

Ensure you have a `kubb.config.ts` file in your project:

```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: {
    path: './petstore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginClient(),
  ],
})
```

### 4. Use with Your AI Assistant

Once configured, you can interact with Kubb through natural language:

**Example conversation with Claude:**

> **You:** "Use Kubb to generate code from my OpenAPI specification."
>
> **Claude:** *Uses the Kubb MCP server to run the generate command*
>
> **Result:** Code generated successfully with real-time progress updates showing:
> - Configuration loading
> - Plugin execution
> - File generation progress
> - Final file count
> -
## Available Tools

The MCP server exposes the following tools to AI assistants:

### `generate`

Generate code from OpenAPI/Swagger specifications using Kubb configuration.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `config` | string | No | `./kubb.config.ts` | Path to kubb.config.ts file |
| `input` | string | No | - | Path to OpenAPI/Swagger spec file (overrides config) |
| `output` | string | No | - | Output directory path (overrides config) |
| `watch` | boolean | No | `false` | Enable watch mode for continuous regeneration |
| `logLevel` | enum | No | `'info'` | Log level: `'silent'`, `'error'`, `'warn'`, `'info'`, `'verbose'`, `'debug'` |


## Use Cases

### Generate Initial Code

When starting a new project or adding API integration:

> **You:** "I have a Swagger file called petstore.yaml. Can you generate TypeScript types for it?"
>
> **AI:** Uses the generate tool to create types from your OpenAPI spec

### Regenerate After Spec Changes

When your OpenAPI specification changes:

> **You:** "The API spec was updated. Please regenerate the client code."
>
> **AI:** Runs generate again to update your generated code

### Debug Generation Issues

When troubleshooting:

> **You:** "The code generation seems slow. Can you run it with verbose logging?"
>
> **AI:** Runs generate with `logLevel: "verbose"` to show plugin timing


## Troubleshooting

### Server Won't Start

**Issue:** `kubb mcp` command not found

**Solution:** Ensure `@kubb/cli` is installed:
```shell
npm install --save-dev @kubb/cli
```

### AI Can't Connect to Server

**Issue:** [Claude](https://claude.ai) doesn't show Kubb as available

**Solution:**
1. Check that `claude_desktop_config.json` is in the correct location
2. Restart [Claude Desktop](https://claude.ai/download) after modifying the config
3. Verify the server starts without errors using `npx kubb mcp`

### Generation Fails

**Issue:** AI reports generation errors

**Solution:**
1. Check that `kubb.config.ts` exists and is valid
2. Ensure the OpenAPI spec path is correct
3. Run with debug logging: ask the AI to use `logLevel: "debug"`
4. Check the `.kubb` directory for detailed log files

### No Progress Updates

**Issue:** AI doesn't show real-time progress

**Solution:** This depends on the MCP client. [Claude Desktop](https://claude.ai/download) may buffer or summarize notifications. The generation is still happening—check the final result.

## Links

- [CLI Documentation](/helpers/cli#kubb-mcp) - Command-line options
- [Claude Setup Guide](/knowledge-base/claude) - Detailed [Claude](https://claude.ai) integration
- [Plugin Documentation](/plugins/core) - Available Kubb plugins
- [Model Context Protocol](https://modelcontextprotocol.io) - Official MCP documentation
- [Claude Desktop](https://claude.ai/download) - Download Claude Desktop app
- [Cursor](https://cursor.sh) - AI-powered code editor with MCP support
