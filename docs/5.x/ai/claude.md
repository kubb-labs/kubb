---
layout: doc
title: Set up the Claude Code plugin
description: The Kubb Claude Code plugin adds slash commands and an agent that
  run Kubb code generation from inside Claude Code.
outline:
  - 2
  - 3
order: 1
navigation:
  title: Claude
  icon: i-simple-icons-claude
---

# Set up the Claude Code plugin

Kubb ships a [Claude Code](https://code.claude.com) plugin. It adds slash commands and an agent
that generate code from an OpenAPI spec. The commands run the `kubb` CLI, so a build you start in
the chat matches the one you run in a terminal.

## Install

The Kubb repository is also a plugin marketplace. Add it, then install the plugin:

```shell [Terminal]
/plugin marketplace add kubb-labs/kubb
/plugin install kubb@kubb
```

The commands run `npx kubb`, so install Kubb yourself, either in the project or globally:

```shell [Terminal]
npm install -D kubb
```

A `SessionStart` hook checks for `kubb` at session start and warns you if it's missing, but it
never installs anything for you.

`kubb init` installs the `@kubb/plugin-*` packages you select.

## Commands

The commands mirror the Kubb CLI, namespaced under `kubb:`.

| Command | What it does |
| --- | --- |
| `/kubb:init [input] [output] [plugins]` | Scaffold `kubb.config.ts` and install plugins with `kubb init`. |
| `/kubb:generate [input]` | Run `kubb generate` and report what changed. |
| `/kubb:validate <spec>` | Validate an OpenAPI or Swagger spec with `kubb validate`. |

A typical first run:

```text [Terminal]
/kubb:validate ./petStore.yaml
/kubb:init ./petStore.yaml ./src/gen plugin-ts,plugin-zod,plugin-react-query
/kubb:generate
```

## Agent

The `kubb-expert` agent handles "add Kubb to my project" from start to finish. It validates the
spec, picks plugins, scaffolds the config, and runs generation.

## Skills

Two skills load on their own when the work calls for them, so you never invoke them directly.

| Skill | When it loads |
| --- | --- |
| `config` | Authoring a `kubb.config.ts`, picking `@kubb/plugin-*` packages, or debugging generated output. |
| `output` | Writing app or test code that imports the generated types, clients, hooks, schemas, and mocks. |

## Conversational generation

The plugin also registers the Kubb MCP server (`kubb mcp`). Describe what you want instead of
typing a command. Claude then calls the server's `validate` and `generate` tools, or runs the
matching `/kubb:` command, and both produce the same files.

Start Claude Code from your project root, so the server finds your `kubb.config.ts`. See
[MCP](/docs/5.x/ai/mcp) for the tools and for other clients.
