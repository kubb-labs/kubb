<div align="center">
  <h1>@kubb/mcp</h1>
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/logo.png" alt="Kubb logo">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]
[![Sponsors][sponsors-src]][sponsors-href]

<h4>
<a href="https://kubb.dev/" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

MCP server for Kubb. Exposes code generation as a tool over the [Model Context Protocol](https://modelcontextprotocol.io) so AI assistants like [Claude](https://claude.ai), [Cursor](https://cursor.sh), and other MCP-compatible clients can generate TypeScript types, API clients, and more from OpenAPI specs using natural language.

The server exposes a `generate` tool that runs a full Kubb build from a `kubb.config.ts`. It streams build events back to the client as real-time progress notifications. The server communicates over stdio and works with any MCP-compatible client.

## Installation

Install as a dev dependency:

```bash
bun add -D @kubb/mcp
# or
pnpm add -D @kubb/mcp
# or
npm install -D @kubb/mcp
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

Using `kubb mcp`:

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

Using the standalone package:

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
import { defineConfig } from 'kubb'
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
  plugins: [pluginOas(), pluginTs(), pluginClient()],
})
```

## Supporting Kubb

Kubb is an open source project with its ongoing development made possible entirely by the support of Sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/mcp?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/mcp
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/mcp?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/mcp
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/mcp
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
