---
layout: doc
title: Connect a project to Studio
description: Connect a local Kubb project to Studio, review generated files, and keep an agent running in the background.
outline: [2, 3]
order: 1
navigation:
  title: Kubb Studio
  icon: i-iconoir-cube
---

# Connect a project to Studio

Use [Kubb Studio](https://kubb.studio) to generate and review a project's clients, types, schemas, hooks, and mocks from the browser. Start with Kubb installed and a `kubb.config.ts` in your project. `kubb studio` needs Kubb 5.6.1 or later, because Studio refuses older agents. `kubb studio snapshot` needs Kubb 5.6.2 or later.

For a quick trial without local setup, use Studio's shared sandbox with a spec you are comfortable providing outside your environment. For a persistent team connection on your infrastructure, use the [Docker agent](https://hub.docker.com/r/kubblabs/kubb-agent). An organization admin approves its pairing code.

## Connect your project

Run this command from the project directory:

```shell [Terminal]
kubb studio
```

Approve the pairing code in the Studio window and answer the permission prompts. Each project directory pairs as its own agent. Keep the command running, select the connected agent in Studio, and generate to see progress and the file tree.

> [!NOTE]
> With a CLI or Docker agent, generation runs in your environment. Studio receives plugin settings, the project path, progress, generated file paths, and a hash of each generated file. A local spec is not uploaded. Reading generated file contents or changing local files requires the agent's permission.

## Review and save generated files

To view file contents and diffs, then write generated files to disk, connect with:

```shell [Terminal]
kubb studio --allow-read --allow-write
```

With no permissions granted, Kubb leaves your output folder alone and Studio sees file paths and progress only. The agent keeps copies of recent generations in `node_modules/.cache/kubb`. The CLI remembers permission answers per project. See [Options](/docs/5.x/reference/commands/studio#options) for `--allow-config-edit`, `--allow-exec`, and the other flags.

## Give your AI tools your API

On the Pro plan, Studio turns an agent's OpenAPI spec into a plugin for Claude Code, Cursor, and Codex. The plugin holds skills that list the API's servers, authentication, operations, and schemas. Your organization gets one plugin marketplace, with one plugin per published agent.

1. Connect the agent with `--allow-read` and run a generation. Studio reads the parsed spec of the latest successful generation.
2. In Studio, open **Settings › your organization › AI**, select **Publish an agent**, and choose the agent.
3. Create a registry key under **Settings › Developers › Tokens**. Git asks for it as the password the first time; any username works.
4. Add the marketplace once with your tool, then install the plugin for each API:

:::code-group{sync="ai-tool"}

```shell [Claude Code]
claude plugin marketplace add https://kubb.studio/plugins/<organization>.git
claude plugin install <plugin>@<organization>
```

```shell [Cursor]
agent plugin marketplace add https://kubb.studio/plugins/<organization>.git
# Then start the Cursor CLI, run /plugin, and install the plugin from the Marketplace tab.
```

```shell [Codex]
codex plugin marketplace add https://kubb.studio/plugins/<organization>.git
# Then start codex, run /plugins, and select Install plugin.
```

:::

Cursor and Codex install a plugin from their plugin browser, not with a command. Studio shows the exact commands for each plugin. Republish the agent after the spec changes, then update the marketplace in your tool.

> [!NOTE]
> Plans without AI plugins see the AI page locked. A registry key in the URL, such as `https://kubb:<key>@kubb.studio/...`, works in CI but ends up in shell history and logs.

## Keep an agent running in the background

Start the connection from your project directory:

```shell [Terminal]
kubb studio start --allow-read
```

Complete pairing and permission prompts if this is the first connection. Check that the worker is connected:

```shell [Terminal]
kubb studio status
```

To end the background connection, run:

```shell [Terminal]
kubb studio stop
```

See [Background connection](/docs/5.x/reference/commands/studio#background-connection) for worker states, logs, and restart behavior.

> [!IMPORTANT]
> Without a TTY the CLI skips the permission prompts, so pass the permission flags the run needs. In CI it does not pair either: set `KUBB_AGENT_TOKEN` to a paired agent's token. A CI API key works only with `kubb studio snapshot`.

## Use a plugin from the registry

Studio lists the plugins in the [Kubb registry](/docs/5.x/reference/registry), but it can only run the ones installed in your project. To enable one marked as not installed, install it from the project directory:

```shell [Terminal]
kubb add acme/plugin-graphql
```

Then reconnect, so the agent reports the new plugin. Stop `kubb studio` and run it again, or run `kubb studio stop` and `kubb studio start` for a background connection. Any installed plugin that ships a `kubb-extension.json` works, with or without a registry entry. See [Plugins in Studio](/docs/5.x/reference/commands/studio#plugins-in-studio).
