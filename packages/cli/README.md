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

# @kubb/cli

### The command-line interface for Kubb

Official CLI for Kubb. Run `kubb generate` to produce TypeScript types, API clients, hooks, validators, and mocks.
Includes interactive project setup (`kubb init`), spec validation, watch mode, and an MCP server.

## Installation

```bash
bun add -D @kubb/cli
# or
pnpm add -D @kubb/cli
# or
npm install -D @kubb/cli
```

## Commands

- [`kubb init`](#kubb-init) — scaffold a new project
- [`kubb generate`](#kubb-generate) — run code generation
- [`kubb validate`](#kubb-validate) — validate an OpenAPI spec
- [`kubb mcp`](#kubb-mcp) — start the MCP server for AI assistants

---

### `kubb init`

Scaffold a `kubb.config.ts` and install plugins for code generation from an OpenAPI spec. Run without flags for an interactive setup wizard, or pass flags to skip the prompts.

```bash
npx kubb init
```

#### Options

| Flag               | Short | Type    | Default          | Description                                |
| ------------------ | ----- | ------- | ---------------- | ------------------------------------------ |
| `--yes`            | `-y`  | boolean | `false`          | Skip all prompts and use defaults          |
| `--input <path>`   | `-i`  | string  | `./openapi.yaml` | Path to the OpenAPI specification          |
| `--output <path>`  | `-o`  | string  | `./src/gen`      | Output directory for generated files       |
| `--plugins <list>` |       | string  |                  | Comma-separated list of plugins to install |

Available plugin values for `--plugins`: `plugin-ts`, `plugin-axios`, `plugin-fetch`, `plugin-react-query`, `plugin-vue-query`, `plugin-zod`, `plugin-faker`, `plugin-msw`, `plugin-cypress`, `plugin-mcp`, `plugin-redoc`.

#### Examples

```bash
# Interactive wizard
npx kubb init

# Accept all defaults
npx kubb init --yes

# Fully non-interactive
npx kubb init --input ./openapi.yaml --output ./src/gen --plugins plugin-ts,plugin-zod

# Select specific plugins only
npx kubb init --plugins plugin-ts,plugin-axios,plugin-react-query
```

The wizard will:

1. Detect or create a `package.json` if one does not exist
2. Prompt for your OpenAPI specification path (default: `./openapi.yaml`)
3. Ask for the output directory (default: `./src/gen`)
4. Let you choose which plugins to install
5. Install the selected packages using your package manager (npm, pnpm, yarn, or bun)
6. Generate a `kubb.config.ts` with your chosen configuration

---

### `kubb generate`

Generate TypeScript types, API clients, React Query hooks, Zod schemas, and more from an OpenAPI specification. Reads `kubb.config.ts` by default. Pass an OpenAPI file path as the first argument to override the input without editing the config.

```bash
npx kubb generate
```

#### Options

| Flag                 | Short | Type    | Default | Description                                                                                         |
| -------------------- | ----- | ------- | ------- | --------------------------------------------------------------------------------------------------- |
| `[input]`            |       | string  |         | OpenAPI file path — overrides `input.path` in the config                                            |
| `--config <path>`    | `-c`  | string  |         | Path to the Kubb config file                                                                        |
| `--logLevel <level>` | `-l`  | string  | `info`  | Log level: `silent`, `info`, or `verbose`                                                           |
| `--watch`            | `-w`  | boolean | `false` | Re-generate whenever the input file changes                                                         |
| `--verbose`          | `-v`  | boolean | `false` | Override log level to `verbose`                                                                     |
| `--silent`           | `-s`  | boolean | `false` | Override log level to `silent`                                                                      |
| `--reporter <names>` |       | string  | `cli`   | Reporters that render the run, comma-separated: `cli`, `json`, `file`. Overrides `config.reporters` |

#### Examples

```bash
# Use kubb.config.ts in the current directory
npx kubb generate

# Override the input spec without editing the config
npx kubb generate ./openapi.yaml

# Point to a custom config file
npx kubb generate --config ./configs/kubb.config.ts

# Watch for changes and regenerate automatically
npx kubb generate --watch

# Verbose output
npx kubb generate --verbose

# Write a JSON run report alongside the CLI output
npx kubb generate --reporter cli,json
```

---

### `kubb validate`

Parse and validate an OpenAPI/Swagger file for structural correctness. Reports schema errors, missing required fields, and malformed references. Use this before running `generate` to catch spec issues early.

```bash
npx kubb validate --input <path-or-url>
```

#### Options

| Flag             | Short | Type   | Required | Description                                         |
| ---------------- | ----- | ------ | -------- | --------------------------------------------------- |
| `--input <path>` | `-i`  | string | ✅       | Path or URL to the OpenAPI/Swagger file to validate |

#### Examples

```bash
# Validate a local file
npx kubb validate --input ./openapi.yaml

# Validate a remote spec
npx kubb validate --input https://petstore3.swagger.io/api/v3/openapi.json
```

---

### `kubb mcp`

Start a Model Context Protocol (MCP) server that exposes Kubb code generation as a tool for AI assistants. Once running, configure your AI client (Claude, Cursor, Windsurf, etc.) to connect — the assistant can then call `kubb generate` directly without leaving the chat.

Runs over **stdio** by default (compatible with all MCP clients). Pass `--port` to expose an HTTP server instead.

```bash
npx kubb mcp
```

#### Options

| Flag                | Short | Type   | Default     | Description                               |
| ------------------- | ----- | ------ | ----------- | ----------------------------------------- |
| `--port <number>`   | `-p`  | string |             | Port for HTTP MCP server (omit for stdio) |
| `--host <hostname>` |       | string | `localhost` | Hostname to bind to (HTTP mode only)      |

#### Examples

```bash
# stdio mode (recommended for Claude Desktop, Cursor, etc.)
npx kubb mcp

# HTTP mode
npx kubb mcp --port 3001
```

#### MCP client configuration

Add the following to your MCP client config (e.g. Claude Desktop's `claude_desktop_config.json`):

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

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/cli.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/cli
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/cli.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/cli
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/cli.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/cli.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/cli
