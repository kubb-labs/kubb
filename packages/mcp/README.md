<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Stars][stars-src]][stars-href]
[![License][license-src]][license-href]
[![Node][node-src]][node-href]

<h4>
<a href="https://kubb.dev" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# @kubb/mcp

### Model Context Protocol server for Kubb

`@kubb/mcp` is the MCP server for Kubb. It exposes Kubb code generation as tools over the [Model Context Protocol](https://modelcontextprotocol.io), so AI assistants such as [Claude](https://claude.ai) and [Cursor](https://cursor.sh) can validate a spec and generate TypeScript types and API clients from the chat.

The server has three tools. `generate` runs a full Kubb build from a `kubb.config.ts` and returns its build events when the build succeeds. A failed build returns its diagnostics instead. `validate` checks an OpenAPI spec, and `init` scaffolds a `kubb.config.ts`.

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
> The `kubb mcp` command comes from `@kubb/cli`, which the `kubb` package includes. Install `kubb` to use it.

## Usage

### Start the MCP server

Start the server using the Kubb CLI:

```bash
npx kubb mcp
```

Or run it directly as a standalone package:

```bash
npx @kubb/mcp
```

Both commands start the same server over stdio.

### Configure an MCP client

Add one of these entries to your MCP client's config, such as `claude_desktop_config.json` for [Claude Desktop](https://claude.ai/download).

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

The server looks for `kubb.config.*` in the directory the client starts it in, and rejects a `config` path outside that directory. Claude Code starts it in the folder you run `claude` from, so register it from the project root:

```bash
claude mcp add kubb -- npx kubb mcp
```

Clients such as Claude Code ignore a `cwd` key in this config. When a client starts the server in another directory, change into the project first (macOS and Linux):

```json
{
  "mcpServers": {
    "kubb-petstore": {
      "command": "sh",
      "args": ["-c", "cd '/path/to/your/project' && npx kubb mcp"]
    }
  }
}
```

### Available tools

#### `generate`

Runs a Kubb build from your config. A successful build returns the build events, and a failed build returns its diagnostics.

Parameters:

- `config` (string, optional): Path to a config file inside the working directory. Defaults to `kubb.config.ts` (or `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`) in the working directory
- `input` (string, optional): Path to OpenAPI/Swagger spec file (overrides config file setting)
- `output` (string, optional): Output directory path (overrides config file setting)
- `logLevel` (enum, optional): One of `'silent'`, `'info'`, `'verbose'` (default: 'info'), passed to a config that exports a function

Examples:

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

#### `validate`

Validates an OpenAPI/Swagger specification from a path or URL.

Parameters:

- `input` (string, required): Path or URL to the OpenAPI/Swagger specification

#### `init`

Writes a `kubb.config.ts` in the working directory without prompts. It does not install packages, and it fails when `kubb.config.ts` already exists.

Parameters:

- `input` (string, optional): Path to the OpenAPI spec (default: `./openapi.yaml`)
- `output` (string, optional): Output directory (default: `./src/gen`)
- `plugins` (string, optional): Comma-separated list of plugins, such as `plugin-ts,plugin-zod`

## Configuration

The `generate` tool looks for `kubb.config.ts` in the working directory by default. Pass `config` to use another config file in that directory.

Example `kubb.config.ts`:

```typescript
import { defineConfig } from 'kubb'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'

export default defineConfig({
  input: './petstore.yaml',
  output: {
    path: './src/generated',
  },
  adapter: adapterOas(),
  plugins: [pluginTs(), pluginAxios()],
})
```

## Supporting Kubb

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)
- [See sponsorship tiers and our sponsors](https://kubb.dev/sponsors)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

## License

[MIT](https://github.com/kubb-labs/kubb/blob/main/licenses/LICENSE-MIT)

<!-- Badges -->

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/mcp.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/mcp
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/mcp.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/mcp
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/mcp.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/mcp.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/mcp
