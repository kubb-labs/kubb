---
layout: doc
title: Telemetry
description: Learn what anonymous usage data Kubb collects, how to opt out, and
  how the data improves the tool.
outline:
  - 2
  - 3
order: 6
navigation:
  title: Telemetry
  icon: i-iconoir-antenna
---

# Telemetry

The Kubb CLI collects anonymous command, plugin, and performance data.

> [!IMPORTANT]
> Telemetry is enabled by default. Disable it any time with the `DO_NOT_TRACK` or `KUBB_DISABLE_TELEMETRY` environment variable.

## What is collected

Telemetry includes these fields:

| Field          | Description                                          | Example                                                                         |
| -------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| `command`      | CLI command that was run                             | `"generate"`, `"validate"`, `"mcp"`                                             |
| `kubbVersion`  | Kubb CLI version                                     | `"5.0.0"`                                                                       |
| `nodeVersion`  | Node.js major version                                | `"22"`                                                                          |
| `runtime`      | JavaScript runtime name                              | `"node"`, `"bun"`, `"deno"`                                                     |
| `runtimeVersion` | Runtime major version                              | `"22"`                                                                          |
| `platform`     | Operating system                                     | `"linux"`, `"darwin"`, `"win32"`                                                |
| `ci`           | Whether running in CI                                | `true`                                                                          |
| `agent`        | Name of the AI coding agent that ran the command, if any | `"claude"`                                                                  |
| `plugins`      | Plugin names and their options (only for `generate`) | `[{ "name": "@kubb/plugin-ts", "options": { "output": { "path": "types" } } }]` |
| `duration`     | Command execution time in milliseconds               | `1432`                                                                          |
| `filesCreated` | Number of files generated (only for `generate`)      | `47`                                                                            |
| `status`       | Whether the command succeeded or failed              | `"success"`                                                                     |

### Commands that send telemetry

| Command            | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `kubb generate`    | Sent after code generation completes or fails        |
| `kubb validate`    | Sent after OpenAPI validation completes or fails     |
| `kubb mcp`         | Sent after the MCP server starts or fails to start   |

## What is not collected

Kubb never sends:

- OpenAPI specification contents
- File paths or directory structures
- Secrets, API keys, or tokens
- Source code or generated code
- IP addresses or user identifiers

## How to opt out

Set `DO_NOT_TRACK` or `KUBB_DISABLE_TELEMETRY` to `1` or `true`:

```shell [Terminal]
DO_NOT_TRACK=1 kubb generate
```

`DO_NOT_TRACK` follows the [cross-tool convention](https://consoledonottrack.com/).

## Data transmission

Telemetry is formatted as [OpenTelemetry OTLP](https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/) traces. Kubb sends them to `https://otlp.kubb.dev/v1/traces` at the end of each command. The request fires only when you are online. It times out after 5 seconds and fails silently if anything goes wrong.
