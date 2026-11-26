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

The server has a tool for every `kubb` command except `studio` and `mcp`. Each tool is named after its command with a `kubb_` prefix. `kubb_generate` runs a full Kubb build from a `kubb.config.ts` and returns its build events when the build succeeds. A failed build returns its diagnostics instead. `kubb_diff` shows what `kubb_generate` would change, `kubb_validate` checks an OpenAPI spec, and `kubb_init` scaffolds a `kubb.config.ts`. `kubb_add`, `kubb_update`, `kubb_remove`, and `kubb_list` manage extensions from the Kubb registry.

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

Every tool sets the MCP annotations: `kubb_validate`, `kubb_diff`, and `kubb_list` are read-only, and `kubb_generate`, `kubb_update`, and `kubb_remove` are destructive. A tool that runs the `kubb` CLI returns 30,000 characters at most. Longer output is cut and ends with an `[Output cut: ...]` notice.

#### `kubb_generate`

Runs a Kubb build from your config. A successful build returns the build events, and a failed build returns its diagnostics.

Parameters:

- `configPath` (string, optional): Path to a config file inside the working directory. Defaults to `kubb.config.ts` (or `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`) in the working directory
- `inputPath` (string, optional): Path or URL of the OpenAPI/Swagger spec (overrides config file setting)
- `outputPath` (string, optional): Output directory path (overrides config file setting)
- `logLevel` (enum, optional): One of `'silent'`, `'info'`, `'verbose'` (default: 'info'), passed to a config that exports a function

Examples:

Using default config file:

```json
{
  "configPath": "./kubb.config.ts"
}
```

Overriding input and output:

```json
{
  "configPath": "./kubb.config.ts",
  "inputPath": "./specs/petstore.yaml",
  "outputPath": "./src/generated"
}
```

With verbose logging:

```json
{
  "configPath": "./kubb.config.ts",
  "logLevel": "verbose"
}
```

#### `kubb_validate`

Validates an OpenAPI/Swagger specification from a path or URL.

Parameters:

- `inputPath` (string, required): Path or URL to the OpenAPI/Swagger specification

#### `kubb_init`

Writes a `kubb.config.ts` in the working directory without prompts. It does not install packages, and it fails when `kubb.config.ts` already exists.

Parameters:

- `inputPath` (string, optional): Path to the OpenAPI spec (default: `./openapi.yaml`)
- `outputPath` (string, optional): Output directory inside the working directory (default: `./src/gen`)

#### `kubb_diff`, `kubb_add`, `kubb_update`, `kubb_remove`, and `kubb_list`

These tools run the `kubb` CLI and return its output and exit code. They use the project's own `kubb`, or the one that started the server when the project has none. The standalone `npx @kubb/mcp` server ships no CLI, so install it in the project with `npm install -D kubb`. `kubb_add`, `kubb_update`, and `kubb_remove` pass `--yes`.

- `kubb_diff` runs `kubb generate --diff --reporter json` and writes nothing. Parameters: `configPath` (string, optional), `format` (`full` for the unified diffs or `summary` for one line per out-of-date file, default `full`), `lockfile` (boolean, default `true`)
- `kubb_add` runs `kubb add <id> --yes`. Parameters: `extensionId` (string, required), `configPath` (string, optional), `install` (boolean, default `true`), `dryRun` (boolean, default `false`)
- `kubb_update` runs `kubb update --yes`, which does not regenerate, so call `kubb_generate` afterwards. Parameters: `extensionIds` (string array, optional, default every installed extension. A major update is installed only for an extension named here), `dryRun` (boolean, default `false`)
- `kubb_remove` runs `kubb remove <id> --yes`. Parameters: `extensionId` (string, required), `configPath` (string, optional), `uninstall` (boolean, default `true`), `dryRun` (boolean, default `false`)
- `kubb_list` runs `kubb list`. No parameters

An `extensionId` is `owner/slug`, or a slug such as `plugin-zod` for an official extension. A `configPath` must stay inside the working directory.

## Configuration

The `kubb_generate` tool looks for `kubb.config.ts` in the working directory by default. Pass `configPath` to use another config file in that directory.

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
