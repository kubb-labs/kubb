<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]
[![Sponsors][sponsors-src]][sponsors-href]

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

Official CLI for Kubb. Run `kubb generate` to transform OpenAPI/Swagger specs into TypeScript types, API clients, hooks, validators, and mocks. Includes interactive project setup (`kubb init`), spec validation, watch mode, MCP server, and agent server commands.

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
- [`kubb agent start`](#kubb-agent-start) — start the HTTP agent server

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

Available plugin values for `--plugins`: `plugin-ts`, `plugin-client`, `plugin-react-query`, `plugin-vue-query`, `plugin-zod`, `plugin-faker`, `plugin-msw`, `plugin-cypress`, `plugin-mcp`, `plugin-redoc`.

#### Examples

```bash
# Interactive wizard
npx kubb init

# Accept all defaults
npx kubb init --yes

# Fully non-interactive
npx kubb init --input ./openapi.yaml --output ./src/gen --plugins plugin-ts,plugin-zod

# Select specific plugins only
npx kubb init --plugins plugin-ts,plugin-client,plugin-react-query
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

| Flag                 | Short | Type    | Default | Description                                              |
| -------------------- | ----- | ------- | ------- | -------------------------------------------------------- |
| `[input]`            |       | string  |         | OpenAPI file path — overrides `input.path` in the config |
| `--config <path>`    | `-c`  | string  |         | Path to the Kubb config file                             |
| `--logLevel <level>` | `-l`  | string  | `info`  | Log level: `silent`, `info`, `verbose`, or `debug`       |
| `--watch`            | `-w`  | boolean | `false` | Re-generate whenever the input file changes              |
| `--debug`            | `-d`  | boolean | `false` | Override log level to `debug`                            |
| `--verbose`          | `-v`  | boolean | `false` | Override log level to `verbose`                          |
| `--silent`           | `-s`  | boolean | `false` | Override log level to `silent`                           |

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

# Debug output
npx kubb generate --debug
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

---

### `kubb agent start`

Start the Kubb Agent HTTP server. Exposes a REST API that accepts a `kubb.config.ts` patch and returns generated code as a stream. Use `--allow-write` to also write files to disk.

```bash
npx kubb agent start
```

#### Options

| Flag                | Short | Type    | Default   | Description                                                       |
| ------------------- | ----- | ------- | --------- | ----------------------------------------------------------------- |
| `--config <path>`   | `-c`  | string  |           | Path to the Kubb config file                                      |
| `--port <number>`   | `-p`  | string  | `3000`    | Port the HTTP server listens on                                   |
| `--host <hostname>` |       | string  | `0.0.0.0` | Hostname the HTTP server binds to                                 |
| `--allow-write`     |       | boolean | `false`   | Write generated files to disk (otherwise output is streamed only) |
| `--allow-all`       |       | boolean | `false`   | Grant all permissions (implies `--allow-write`)                   |

#### Examples

```bash
# Start with defaults
npx kubb agent start

# Custom port
npx kubb agent start --port 4000

# Allow writing files to disk
npx kubb agent start --allow-write

# Full permissions with custom config
npx kubb agent start --config ./kubb.config.ts --allow-all
```

See the [`@kubb/agent` README](../agent/README.md) for full environment variable reference, Docker setup, WebSocket API, and Studio integration.

## Supporting Kubb

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

## License

[MIT](https://github.com/kubb-labs/kubb/blob/main/licenses/LICENSE-MIT)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/cli?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/cli
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/cli?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/cli
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[build-src]: https://img.shields.io/github/actions/workflow/status/kubb-labs/kubb/ci.yaml?style=flat&colorA=18181B&colorB=f58517
[build-href]: https://www.npmjs.com/package/@kubb/cli
[minified-src]: https://img.shields.io/bundlephobia/min/@kubb/cli?style=flat&colorA=18181B&colorB=f58517
[minified-href]: https://www.npmjs.com/package/@kubb/cli
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/cli
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
