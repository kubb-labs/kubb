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
`SKILL.md` format, cross-provider). Always-on conventions live in `.claude/rules/`
(`code-style`, `jsdoc`, `markdown`, `plain-language`, `testing`, `security`, `usa-english`),
and `.claude/` also holds commands, subagents, output styles, and hooks.

Shared skills come from [stijnvanhulle/agents](https://github.com/stijnvanhulle/agents).
Install the `agents` plugin (`agents@stijnvanhulle`) for Claude Code, Cursor, and Codex.

- [ask](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/ask/SKILL.md) - Ask a blocking multiple-choice question with the client's native picker, or a lettered list when none exists.
- [backlog](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/backlog/SKILL.md) - Triage recent GitHub, ClickUp, or Jira issues, then implement confirmed ones in isolated worktrees.
- [branch](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/branch/SKILL.md) - Name and create a Conventional Commit branch from a GitHub, ClickUp, or Jira issue.
- [changelog](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/changelog/SKILL.md) - Turn commit history and changesets into user-facing release notes.
- [changeset](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/changeset/SKILL.md) - Write or review a release-note changeset with the correct bump.
- [conventions](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/conventions/SKILL.md) - Apply the shared TypeScript, markdown, testing, security, and language rules.
- [deslop](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/deslop/SKILL.md) - Audit a diff for over-engineering and AI code/prose tells, then apply only confirmed fixes.
- [documentation](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/documentation/SKILL.md) - Write or review developer documentation using the project style and SEO guidance.
- [humanizer](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/humanizer/SKILL.md) - Find AI writing tells and apply only confirmed rewrites.
- [issue](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/issue/SKILL.md) - Create or triage a GitHub or Jira issue with its type, labels, and fields filled.
- [jsdoc](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/jsdoc/SKILL.md) - Apply the TypeScript JSDoc format, examples, tags, and ordering.
- [pr](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/pr/SKILL.md) - Prepare, open, update, or assess a pull request, including checks, changesets, title, template, and CI.

<skills>

## Skills

</skills>
