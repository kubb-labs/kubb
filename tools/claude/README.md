# Kubb — Claude Code plugin

Kubb is a meta framework for code generation. It turns an OpenAPI spec into TypeScript types,
Zod schemas, Axios and fetch clients, React Query and Vue Query hooks, Faker mocks and more,
without leaving Claude Code. The plugin bundles the [Kubb MCP server](https://www.npmjs.com/package/@kubb/mcp)
so Claude can scaffold, validate and run code generation for you.

## What you get

- **MCP server** — runs `kubb mcp`, exposing the `init`, `generate` and `validate` tools to
  Claude.
- **Commands** — mirror the Kubb CLI / MCP tools (`init`, `generate`, `validate`)
  - `/kubb:init [input] [output] [plugins]` — scaffold `kubb.config.ts` and install plugins.
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
claude --plugin-dir ./tools/claude
```

## Usage

```text
/kubb:init ./petstore.yaml
```

Claude asks which outputs you want, scaffolds `kubb.config.ts`, and installs the packages. Run
`/kubb:validate` first to check the spec, then `/kubb:generate` to re-run codegen whenever the
spec changes.

Learn more at [kubb.dev](https://kubb.dev).
