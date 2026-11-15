---
layout: doc
title: Set up the Claude Code plugin
description: Install the Kubb Claude Code plugin to get /kubb slash commands, the kubb-expert agent, two skills, and the Kubb MCP server in Claude Code.
outline:
  - 2
  - 3
order: 1
navigation:
  title: Claude
  icon: i-simple-icons-claude
---

# Set up the Claude Code plugin

The Kubb plugin for [Claude Code](https://code.claude.com) adds slash commands, an agent, two skills, and the Kubb MCP server. The commands run the `kubb` CLI, so a build from the chat matches one from the terminal.

::steps{level="2"}

## Install the plugin

Add the Kubb repository as a plugin marketplace, then install the plugin:

```shell [Terminal]
/plugin marketplace add kubb-labs/kubb
/plugin install kubb@kubb
```

## Install Kubb

The commands run `npx kubb`, so install Kubb in the project or globally:

```shell [Terminal]
npm install -D kubb
```

A `SessionStart` hook warns you when `kubb` is missing. It never installs anything.

::

## Commands

| Command | Runs |
| --- | --- |
| `/kubb:init [input] [output] [plugins]` | [`kubb init`](/docs/5.x/reference/commands/init) with `--yes`, to write `kubb.config.ts` and install the plugins. |
| `/kubb:generate [input]` | [`kubb generate`](/docs/5.x/reference/commands/generate), then reports what changed. |
| `/kubb:validate <spec>` | [`kubb validate`](/docs/5.x/reference/commands/validate) on an OpenAPI or Swagger spec. |

A first run:

```text [Claude Code]
/kubb:validate ./petStore.yaml
/kubb:init ./petStore.yaml ./src/gen plugin-ts,plugin-axios,plugin-zod,plugin-react-query
/kubb:generate
```

## Agent and skills

The `kubb-expert` agent handles "add Kubb to my project": it validates the spec, picks plugins, scaffolds the config, and runs Kubb. Two skills load on their own:

| Skill | Loads when you |
| --- | --- |
| `config` | Write a `kubb.config.ts`, pick `@kubb/plugin-*` packages, or debug generated output. |
| `output` | Write app or test code that imports the generated types, clients, hooks, schemas, and mocks. |

## Generate from a conversation

The plugin registers the Kubb MCP server (`npx kubb mcp`). Describe what you want, and Claude calls the server's [tools](/docs/5.x/reference/commands/mcp#tools) or runs the matching `/kubb:` command. Start Claude Code from your project root, so the server finds your `kubb.config.ts`.

> [!NOTE]
> When `kubb.config.ts` exports an array, the MCP [`generate`](/docs/5.x/reference/commands/mcp#generate) tool runs only its first config. The `/kubb:generate` command runs them all.

[Set up the MCP server](/docs/5.x/ai/mcp) covers other clients.
