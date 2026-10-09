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

Plugins are maintained in a separate monorepo at [kubb-labs/plugins](https://github.com/kubb-labs/plugins). Extension metadata and the docs pages live in the docs repo ([kubb-labs/docs](https://github.com/kubb-labs/docs), `plugins/<id>/index.md`, `adapters/<id>/index.md`, and `parsers/<id>/index.md` with their `reference/options.md`), published on [kubb.dev](https://kubb.dev). When an extension's options change here, update its kubb.dev docs page there.

## How agents read this repo

`AGENTS.md` is the canonical instruction file. Local skills live in `.agents/skills/` (open
`SKILL.md` format, cross-provider). Shared skills, convention rules, `/create-pr`,
`/create-changeset`, `/create-branch`, `/create-issue`, the `code-reviewer` subagent, and the
`house` output style come from the `agents` plugin
([stijnvanhulle/agents](https://github.com/stijnvanhulle/agents)). Claude Code loads it from
this repo's `.claude/settings.json`. Install `agents@stijnvanhulle` for Cursor and Codex.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
