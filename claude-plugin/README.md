# Kubb — Claude Code plugin

Generate TypeScript types, clients, framework hooks, Zod schemas and mocks from an OpenAPI
spec, without leaving Claude Code. The plugin bundles the [Kubb MCP server](https://www.npmjs.com/package/@kubb/mcp)
so Claude can scaffold, validate and run code generation for you.

## What you get

- **MCP server** — runs `kubb mcp`, exposing the `init`, `generate` and `validate` tools to
  Claude.
- **Commands**
  - `/kubb:setup [spec]` — validate a spec, write `kubb.config.ts`, install packages, generate.
  - `/kubb:generate [config]` — run code generation and report what changed.
  - `/kubb:validate <spec>` — validate an OpenAPI/Swagger spec.
- **Skill** — `config`: how to author `kubb.config.ts` and pick the right `@kubb/plugin-*`
  packages.
- **Agent** — `kubb-expert`: end-to-end "add Kubb to my project" tasks.

## Requirements

The MCP server runs `npx kubb mcp`, so the consuming project needs Kubb installed:

```bash
npm install -D kubb @kubb/mcp
# add @kubb/adapter-oas if you want the validate tool
```

## Install

```bash
# add this repo as a marketplace, then install the plugin
/plugin marketplace add kubb-labs/kubb
/plugin install kubb@kubb
```

To try it locally before publishing:

```bash
claude --plugin-dir ./claude-plugin
```

## Usage

```text
/kubb:setup ./petstore.yaml
```

Claude validates the spec, asks which outputs you want, writes `kubb.config.ts`, installs the
packages, and runs the first generation. From there, `/kubb:generate` re-runs codegen whenever
the spec changes.

Learn more at [kubb.dev](https://kubb.dev).
