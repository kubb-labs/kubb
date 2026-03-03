---
layout: doc

title: Kubb Telemetry - Anonymous Usage Data
description: Learn what anonymous data Kubb CLI collects, why it is collected, and how to opt out using the DO_NOT_TRACK environment variable.
outline: deep
---

# Telemetry

The Kubb CLI collects **anonymous, non-identifiable usage data** to help improve the tool. This data helps us understand which plugins and features are most used, identify performance bottlenecks, and prioritize future development.

> [!IMPORTANT]
> Telemetry is enabled by default and can be disabled at any time using the `DO_NOT_TRACK` or `KUBB_DISABLE_TELEMETRY` environment variable.

## What Is Collected?

The following anonymous data is sent after each CLI command:

| Field | Description | Example |
|---|---|---|
| `command` | CLI command that was run | `"generate"`, `"validate"`, `"mcp"`, `"agent"` |
| `kubbVersion` | Kubb CLI version | `"4.30.0"` |
| `nodeVersion` | Node.js major version | `"20"` |
| `platform` | Operating system | `"linux"`, `"darwin"`, `"win32"` |
| `ci` | Whether running in CI | `true` |
| `plugins` | Plugin names **and their options** (only for `generate`) | `[{ "name": "@kubb/plugin-ts", "options": { "output": { "path": "types" } } }]` |
| `duration` | Command execution time in milliseconds | `1432` |
| `filesCreated` | Number of files generated (only for `generate`) | `47` |
| `status` | Whether the command succeeded or failed | `"success"` |

### Commands that send telemetry

| Command | Description |
|---|---|
| `kubb generate` | Sent after code generation completes or fails |
| `kubb validate` | Sent after OpenAPI validation completes or fails |
| `kubb mcp` | Sent after the MCP server starts or fails to start |
| `kubb agent start` | Sent after the agent server starts or fails to start |

## What Is **Not** Collected

We take privacy seriously. The following data is **never** sent:

- OpenAPI specification contents
- File paths or directory structures
- Secrets, API keys, or tokens
- Source code or generated code
- IP addresses or user identifiers

## How to Opt Out

There are two ways to disable telemetry:

### Option 1 — `DO_NOT_TRACK` (recommended)

`DO_NOT_TRACK` is a [standard cross-tool opt-out convention](https://consoledonottrack.com/) supported by many developer tools.

```shell
DO_NOT_TRACK=1 kubb generate
```

Add it to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) to disable it permanently:

```shell
export DO_NOT_TRACK=1
```

### Option 2 — `KUBB_DISABLE_TELEMETRY`

Kubb-specific opt-out flag:

```shell
KUBB_DISABLE_TELEMETRY=1 kubb generate
```

Or permanently via your shell profile:

```shell
export KUBB_DISABLE_TELEMETRY=1
```

Both environment variables accept `"1"` or `"true"` as values.

## How the Data Is Used

The collected data is used exclusively to:

- Understand which plugins and features are actively used
- Detect performance regressions across Kubb versions
- Identify deprecated options that users still depend on
- Guide prioritization of new features and bug fixes

The data is aggregated and anonymized — individual runs cannot be linked to a specific project or user.

## Data Transmission

Telemetry events are formatted as [OpenTelemetry OTLP](https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/) traces and sent via a single HTTP `POST` request to `https://otlp.kubb.dev/v1/traces` at the end of each command. The request:

- Only fires when an internet connection is available (detected automatically)
- Has a 5-second timeout and fails silently if the endpoint is unreachable
- Will never delay or interrupt the CLI output
