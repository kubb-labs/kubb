# AGENTS.md

Kubb is a code-generation toolkit for generating TypeScript, React-Query, Zod, Faker.js, MSW and more from OpenAPI specifications. It uses a plugin-based architecture with an Abstract Syntax Tree (AST) layer.

## High-level architecture

Kubb is built from:
- Core engine (`@kubb/core`) runs the plugin system and orchestrates code generation
- Authoring kit (`@kubb/kit`, reached through the `kubb/kit` subpath) bundles the helpers for building plugins, generators, adapters, resolvers, and renderers
- Adapters (`@kubb/adapter-oas`) transform OpenAPI specs into an AST
- Renderers and utilities turn the AST into code
- The CLI is the entry point for code generation
- MCP server adds Model Context Protocol integration for AI assistants

## Project structure and commands

The full folder structure, repository setup, and commands live in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Repository setup

| Aspect | Choice |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Module system | ESM-only (`type: "module"`) |
| Node version | 22 |
| Package manager | pnpm 11+ |
| Linter | oxlint |
| Formatter | oxfmt |
| Bundler | tsdown |
| Tests | Vitest |
| Versioning | Changesets |
| CI/CD | GitHub Actions |

## Plugin ecosystem

Plugins are maintained in a separate monorepo at [kubb-labs/plugins](https://github.com/kubb-labs/plugins). Extension metadata and the docs pages live in the platform repo ([kubb-labs/platform](https://github.com/kubb-labs/platform), `apps/kubb.dev/extensions/` and `apps/kubb.dev/plugins/`), published on [kubb.dev](https://kubb.dev). When an extension's options change here, update its kubb.dev docs page there.

## Token optimized CLI (rtk)

`rtk` is a CLI proxy that filters and compresses command output to cut token usage. Prefix shell
commands with it so their output stays small:

```bash
rtk git status
rtk git log -10
rtk pnpm test
```

Run these meta commands directly:

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw without filtering but still track usage
```

## How agents read this repo

`AGENTS.md` is the canonical instruction file. Local skills live in `.agents/skills/` (open
`SKILL.md` format, cross-provider). Shared skills, convention rules, `/create-pr`,
`/create-changeset`, `/create-branch`, `/create-issue`, the `code-reviewer` subagent, and the
`house` output style come from the `agents` plugin
([stijnvanhulle/agents](https://github.com/stijnvanhulle/agents)). Claude Code loads it from
this repo's `.claude/settings.json`. Install `agents@stijnvanhulle` for Cursor and Codex.

<skills>

## Skills

</skills>
