# @kubb/mcp

Model Context Protocol (MCP) server for Kubb.

## Overview

This package provides an MCP server that exposes Kubb's code generation functionality through the [Model Context Protocol](https://modelcontextprotocol.io), allowing AI assistants like [Claude](https://claude.ai), [Cursor](https://cursor.sh), and other MCP-compatible clients to generate code from OpenAPI specifications using natural language.

The server acts as a bridge between MCP clients (like [Claude Desktop](https://claude.ai/download)) and Kubb's build system, enabling conversational code generation workflows.

## Features

- **Generate Tool**: Generate TypeScript types, API clients, and more from OpenAPI specs using your `kubb.config.ts`
- **Real-time Progress Notifications**: Stream build events and progress updates to the MCP client
- Uses `@kubb/core` build functionality directly
- Lightweight and focused on code generation

## Installation

Install as a dev dependency:

```bash [npm]
npm install --save-dev @kubb/mcp
```

> [!IMPORTANT]
> You also need to install `@kubb/cli` to use the `kubb mcp` command.

## Usage

### Start the MCP Server

Start the server using the Kubb CLI:

```bash
npx kubb mcp
```

Or run it directly as a standalone package:

```bash
npx @kubb/mcp
```

This starts an MCP server that communicates via stdio (standard input/output), making it compatible with MCP clients.

### Configure MCP Client

Add to your MCP client configuration (e.g., [Claude Desktop](https://claude.ai/download)'s `claude_desktop_config.json`):

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

For project-specific configurations, you can specify the working directory:

```json
{
  "mcpServers": {
    "kubb-petstore": {
      "command": "npx",
      "args": ["@kubb/mcp"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### Available Tools

#### `generate`

Generate code from OpenAPI/Swagger specifications using Kubb configuration.

**Parameters:**
- `config` (string, optional): Path to kubb.config.ts file. If not provided, looks for kubb.config.ts in current directory
- `input` (string, optional): Path to OpenAPI/Swagger spec file (overrides config file setting)
- `output` (string, optional): Output directory path (overrides config file setting)
- `logLevel` (enum, optional): Control logging verbosity - `'silent'`, `'error'`, `'warn'`, `'info'`, `'verbose'`, `'debug'` (default: 'info')

**Examples:**

Using default config file:
```json
{
  "config": "./kubb.config.ts"
}
```

Overriding input and output:
```json
{
  "config": "./kubb.config.ts",
  "input": "./specs/petstore.yaml",
  "output": "./src/generated"
}
```

With verbose logging:
```json
{
  "config": "./kubb.config.ts",
  "logLevel": "verbose"
}
```

## Configuration

The build tool looks for `kubb.config.ts` in the current directory by default. You can also provide an inline configuration or path to a config file.

Example `kubb.config.ts`:

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
    path: './src/generated',
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginClient(),
  ],
})
```

## License

MIT

