# Kubb Claude Code plugin

Kubb is a meta framework for code generation. It turns an OpenAPI spec into TypeScript types,
Zod schemas, Axios and fetch clients, React Query and Vue Query hooks, Faker mocks and more,
without leaving Claude Code.

## What you get

Slash commands that run the Kubb CLI:

- `/kubb:init [input] [output] [plugins]` scaffolds `kubb.config.ts` and installs plugins.
- `/kubb:generate [input]` runs code generation and reports what changed.
- `/kubb:validate <spec>` validates an OpenAPI or Swagger spec.

A `config` skill teaches Claude how to write `kubb.config.ts` and pick the right
`@kubb/plugin-*` packages. A `kubb-expert` agent handles whole "add Kubb to my project" tasks
from spec to generated code. The plugin also wires in the
[Kubb MCP server](https://www.npmjs.com/package/@kubb/mcp) (`kubb mcp`) for conversational
generation when you would rather chat than run a command.

## Requirements

The commands run `npx kubb`, so install Kubb yourself, in the project or globally:

```bash
npm install -D kubb   # in the project
npm install -g kubb   # or globally
```

A `SessionStart` hook checks for `kubb` when a session starts and warns you when it is missing, so
you can install it before running a command. It never installs anything for you.

Add `@kubb/adapter-oas` if you want `kubb validate`, and `kubb init` installs the
`@kubb/plugin-*` packages you select.

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
