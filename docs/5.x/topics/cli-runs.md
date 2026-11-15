---
layout: doc
title: CLI runs - Watch mode, summary, and diagnostics
description: What kubb generate --watch follows, how to read the run summary, when the update check runs, and the extra detail behind each diagnostic code.
outline:
  - 2
  - 3
order: 8
navigation:
  title: CLI runs
  icon: i-iconoir-terminal
---

# CLI runs

Use these details when `kubb generate` runs in watch mode, prints its summary, checks for updates, or reports a diagnostic code you need to understand.

## Watch mode {#watch-mode}

When you run `kubb generate --watch`, Kubb follows a local `input` file only. A URL or git input is generated once, so rerun Kubb after the remote spec changes. Sources: [Watch mode](/docs/5.x/reference/commands/generate#watch-mode) and [recipes](/docs/5.x/how-to/recipes#watch-mode-several-specifications-and-scripts).

| Event | What happens |
| --- | --- |
| The first build fails | Kubb keeps watching, so you can fix the input. |
| A rebuild ends | A line shows the duration and the schemas and operations the spec gained or lost. The summary below it lists the files the rebuild added, modified, or removed. |
| You press `r` | Kubb rebuilds. Keys work in an interactive terminal. |
| You press `q` | Kubb quits with exit code 0. |
| You press Ctrl+C | Kubb quits with exit code 130. |

To keep `clean` off during incremental runs, pass a function to `defineConfig` and read `watch`. See [Config function](/docs/5.x/reference/configuration#config-function).

### Adapter sources

When you write an adapter, its `sources` member lists the files and URLs the last `parse()` read, even unreadable ones. A watcher rebuilds when one of them changes. See [Adapters](/docs/5.x/reference/kit/adapters).

## Run summary {#run-summary}

When a run ends, the `cli` reporter prints a summary. It starts with the outcome and duration, then the plugin results and the output path. Source: [Reporters](/docs/5.x/reference/commands/generate#reporters).

```text [Summary]
✓ Generation complete  466ms

  17 files generated · 54 unchanged
  Plugins  4 passed
  Output   ./src/gen

File changes
  14 added · 3 modified · 1 deleted
  Lines  +312 −47
```

| Entry | What it counts |
| --- | --- |
| `unchanged` | Files whose content did not change, also when `output.clean` rewrites the folder. |
| `File changes` | The output on disk compared with its content before the run. Custom storage drivers leave this section out. |
| `Lines` | The count of each line, so moving a line inside a file is not a removal plus an addition. |

With `--dry-run`, the summary shows the planned file changes. It says "planned" and "Nothing was written."

## Update check {#update-check}

When a run prints [`KUBB_UPDATE_AVAILABLE`](/docs/5.x/reference/diagnostics#kubb-update-available) without a network request, it reuses an earlier answer.

- `kubb generate` asks npm at most once every 24 hours and keeps the answer in `KUBB_HOME` (default `~/.kubb`), so the notice also shows on runs that make no request.
- CI skips the check, detected from variables such as `CI` or `GITHUB_ACTIONS`.

## Diagnostic details {#diagnostic-details}

When a [diagnostic](/docs/5.x/reference/diagnostics) needs more context than its entry gives, look up its code here.

| Code | Detail |
| --- | --- |
| [`KUBB_ADAPTER_FAILED`](/docs/5.x/reference/diagnostics#kubb-adapter-failed) | Errors the adapter reports on purpose, such as `KUBB_REF_NOT_FOUND`, keep their own code. |
| [`KUBB_ADAPTER_REQUIRED`](/docs/5.x/reference/diagnostics#kubb-adapter-required) | `defineConfig` adds the OpenAPI adapter when `adapter` is left out, so this happens only with a custom adapter or with `createKubb` from `@kubb/core`. |
| [`KUBB_BARREL_DUPLICATE_EXPORT`](/docs/5.x/reference/diagnostics#kubb-barrel-duplicate-export) | The barrel keeps the first export and drops the rest, so the code still parses, but the run fails. |
| [`KUBB_INLINE_FAILED`](/docs/5.x/reference/diagnostics#kubb-inline-failed) | One diagnostic lists every case. |
| [`KUBB_INPUT_NOT_FOUND`](/docs/5.x/reference/diagnostics#kubb-input-not-found) | A URL reports `KUBB_INPUT_REQUEST_FAILED` or `KUBB_INPUT_UNREACHABLE` instead. |
| [`KUBB_INPUT_REQUEST_FAILED`](/docs/5.x/reference/diagnostics#kubb-input-request-failed) | A 404 means a wrong path, and a 5xx a failing server. |
| [`KUBB_INPUT_UNREACHABLE`](/docs/5.x/reference/diagnostics#kubb-input-unreachable) | The message names which cause applies. |
| [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context) | The composable has no plugin to apply to. The message names the composable. |
| [`KUBB_PLUGIN_FAILED`](/docs/5.x/reference/diagnostics#kubb-plugin-failed) | The diagnostic names the plugin and keeps the thrown error as its cause. |
| [`KUBB_UNKNOWN`](/docs/5.x/reference/diagnostics#kubb-unknown) | The terminal shows no docs link for it. |
| [`KUBB_INVALID_SPEC`](/docs/5.x/reference/diagnostics#kubb-invalid-spec) | `@kubb/adapter-oas` checks while [`validate`](/extensions/kubb-labs/adapter-oas/options#validate) is `true`, the default. The validator does not support OpenAPI 3.2 yet, so a 3.2 document gets this code with a message that it was not validated. |
| [`KUBB_UNSUPPORTED_FORMAT`](/docs/5.x/reference/diagnostics#kubb-unsupported-format) | Kubb reports each format once, with a count, at the first schema that uses it. |
| [`KUBB_PERFORMANCE`](/docs/5.x/reference/diagnostics#kubb-performance) | It is never printed as a problem. |
| [`KUBB_PLUGIN_WARNING`](/docs/5.x/reference/diagnostics#kubb-plugin-warning), [`KUBB_PLUGIN_INFO`](/docs/5.x/reference/diagnostics#kubb-plugin-info) | Plugin authors can add a stable code and a location with `Diagnostics.report`. |
