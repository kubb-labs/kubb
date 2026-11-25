---
layout: doc
title: Connect a project to Kubb Studio
description: Pair a local Kubb project with Kubb Studio, choose what Studio may read and write, review generated code in the browser, and keep an agent running.
outline: [2, 3]
order: 1
navigation:
  title: Kubb Studio
  icon: i-iconoir-cube
---

# Connect a project to Kubb Studio

[Kubb Studio](https://kubb.studio) lets you generate and review your project's clients, types, schemas, hooks, and mocks from the browser. `kubb studio` connects your project as an agent: Studio sends the job, and Kubb runs on your machine.

`kubb studio` needs Kubb 5.11.6 or later. Studio refuses older agents. Pick the agent that fits:

| Agent | Runs on | Use it for |
| --- | --- | --- |
| `kubb studio` | Your machine | Your own project |
| [Docker agent](https://hub.docker.com/r/kubblabs/kubb-agent) | Your infrastructure | A team connection that stays up. An organization admin approves its pairing code. |
| Shared sandbox | Studio | A quick trial, with a spec you are fine sharing |
| `kubb studio snapshot` | CI | A package per pull request: [CI snapshots](/docs/5.x/integrations/ci) |

## Connect your project

Run this in your project folder:

```shell [Terminal]
kubb studio
```

Approve the pairing code in Studio and answer the permission prompts. Keep the command running, select the agent in Studio, and generate. Each project folder pairs as its own agent.

## Choose permissions {#permissions}

Every permission is off by default. Without any, Studio sees file paths, progress, and a hash of each generated file, and the agent never uploads a local spec. The CLI remembers your answers per project.

| Flag | Lets Studio |
| --- | --- |
| `--allow-read` | Read generated file contents and diffs. |
| `--allow-read-ast` | Read the spec as Kubb parsed it. |
| `--allow-write` | Write generated files to your output folder. |
| `--allow-exec` | Run the formatter, the linter, and `output.postGenerate`. Needs `--allow-write` too. |

See [Permissions](/docs/5.x/reference/commands/studio#permissions) for every flag, such as `--allow-config-edit`.

## Review and save generated files

Connect with both flags to view contents and diffs, then write the files to disk:

```shell [Terminal]
kubb studio --allow-read --allow-write
```

- Without `--allow-write`, Kubb stages the files in a temporary folder and leaves your output folder unchanged.
- With `--allow-read`, Studio opens your existing output before you generate, so line comments and HTML previews work at once. Each later generation compares with the previous one.
- The agent keeps recent generations in `node_modules/.cache/kubb`. See [Environment variables](/docs/5.x/reference/commands#environment-variables) for the limits.

## Keep an agent running in the background

```shell [Terminal]
kubb studio start --allow-read   # pair if needed, then connect in the background
kubb studio status               # check that the worker is connected
kubb studio stop                 # end the background connection
```

See [Background connection](/docs/5.x/reference/commands/studio#background-connection) for worker states, logs, and restarts.

> [!IMPORTANT]
> Without a TTY, the CLI skips the permission prompts, so pass the flags the run needs. In CI it does not pair either: use [`kubb studio snapshot`](/docs/5.x/integrations/ci) with a CI API key.
