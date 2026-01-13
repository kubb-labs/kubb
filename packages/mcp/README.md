# @kubb/mcp

Model Context Protocol (MCP) server for Kubb - an OpenAPI code generator.

## Overview

This package provides an MCP server that exposes Kubb's build functionality through the Model Context Protocol, allowing AI assistants and other MCP clients to generate code from OpenAPI specifications.

## Features

- **Build Tool**: Generate TypeScript types, API clients, and more from OpenAPI specs using your kubb.config.ts
- **Real-time Progress Notifications**: Stream build events and progress updates to the MCP client
- Uses `@kubb/core` build functionality directly
- Lightweight and focused on code generation

## Installation

```bash
npm install @kubb/mcp
```

## Usage

### As an MCP Server

Start the server:

```bash
npx kubb mcp
```

Or add to your MCP client configuration (e.g., Claude Desktop):

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

### Available Tools

#### `build`

Build OpenAPI spec using Kubb configuration.

**Parameters:**
- `config` (optional): Path to kubb.config.ts file or inline JSON config string
- `input` (optional): Path to OpenAPI/Swagger spec file (overrides config)
- `output` (optional): Output directory path (overrides config)

**Example:**

```json
{
  "config": "./kubb.config.ts",
  "input": "./petstore.yaml",
  "output": "./src/generated"
}
```

### Real-time Notifications

The build tool streams real-time progress notifications to the MCP client via the `kubb/progress` notification method. This enables live feedback during code generation.

**Notification Types:**

- `CONFIG_LOADED` - Configuration file loaded
- `CONFIG_READY` - Configuration validated and ready
- `SETUP_START` / `SETUP_END` - Kubb initialization phase
- `BUILD_START` / `BUILD_END` - Build phase
- `PLUGIN_START` / `PLUGIN_END` - Individual plugin execution with duration
- `FILES_START` / `FILES_END` - File processing phase
- `FILE_UPDATE` - Individual file being processed
- `GENERATION_START` / `GENERATION_END` - Overall generation lifecycle
- `INFO` - Informational messages
- `SUCCESS` - Success messages
- `WARN` - Warning messages
- `ERROR` - Error messages with stack trace
- `BUILD_SUCCESS` - Final success notification with file count
- `BUILD_FAILED` - Build failure notification with error details
- `FATAL_ERROR` - Unexpected fatal error

**Notification Payload Example:**

```json
{
  "type": "FILE_UPDATE",
  "message": "Processing file: src/generated/client.ts",
  "timestamp": "2024-01-13T10:30:45.123Z"
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

