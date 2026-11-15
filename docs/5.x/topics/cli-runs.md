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

When you run `kubb generate --watch`, Kubb follows a local `input` file only. A URL or git input is generated once, so rerun Kubb after the remote spec changes. A file the input references with `$ref`, such as `schemas/Pet.yaml`, is not watched either. After you edit one, press `r` or rerun Kubb to rebuild. Sources: [Watch mode](/docs/5.x/reference/commands/generate#watch-mode) and [recipes](/docs/5.x/how-to/recipes#watch-mode-several-specifications-and-scripts).

| Event | What happens |
| --- | --- |
| The first build fails | Kubb keeps watching, so you can fix the input. |
| A rebuild ends | A line shows the duration and the schemas and operations the spec gained or lost. The summary below it lists the files the rebuild added, modified, or removed. |
| You press `r` | Kubb rebuilds. Keys work in an interactive terminal. |
| You press `q` | Kubb quits with exit code 0. |
| You press Ctrl+C | Kubb quits with exit code 130. |

To keep `clean` off during incremental runs, pass a function to `defineConfig` and read `watch`. See [Config function](/docs/5.x/reference/configuration#config-function).

### Adapter sources

When you write an adapter, its `sources` member lists the files and URLs the last `parse()` read, even unreadable ones. A watcher can rebuild when one of them changes, but `kubb generate --watch` does not read them. See [Adapters](/docs/5.x/reference/kit/adapters).

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
| [`KUBB_BARREL_DUPLICATE_EXPORT`](/docs/5.x/reference/diagnostics#kubb-barrel-duplicate-export) | The barrel keeps the first export and drops the rest, so the code still parses, but the run fails. A type and a value may share a name. |
| [`KUBB_DUPLICATE_DISCRIMINATOR`](/docs/5.x/reference/diagnostics#kubb-duplicate-discriminator) | Zod's `z.discriminatedUnion` throws on the first parse of such a union. |
| [`KUBB_FORMAT_FAILED`](/docs/5.x/reference/diagnostics#kubb-format-failed) | Check the formatter's install and config. |
| [`KUBB_GIT_INPUT_FAILED`](/docs/5.x/reference/diagnostics#kubb-git-input-failed) | `git` is missing, the repository or ref does not exist, or the credentials were refused. For a private repository, set up a credential helper or SSH key. |
| [`KUBB_INCOMPATIBLE_EXTENSION`](/docs/5.x/reference/diagnostics#kubb-incompatible-extension) | Kubb checks at run time and in `kubb add`. |
| [`KUBB_INLINE_FAILED`](/docs/5.x/reference/diagnostics#kubb-inline-failed) | The imported name has no inline definition, refers to itself, or has no parser that supports inlining. One diagnostic lists every case. |
| [`KUBB_INPUT_NOT_FOUND`](/docs/5.x/reference/diagnostics#kubb-input-not-found) | A URL reports `KUBB_INPUT_REQUEST_FAILED` or `KUBB_INPUT_UNREACHABLE` instead. |
| [`KUBB_INPUT_REQUEST_FAILED`](/docs/5.x/reference/diagnostics#kubb-input-request-failed) | A 404 means a wrong path, and a 5xx a failing server. The extension commands also report it for an invalid [registry](/docs/5.x/reference/registry) index. |
| [`KUBB_INPUT_UNREACHABLE`](/docs/5.x/reference/diagnostics#kubb-input-unreachable) | The causes are a refused connection, an unknown host, an expired certificate, or a timeout, and the message names which one applies. For a local server, check the port. |
| [`KUBB_INTERNAL_ERROR`](/docs/5.x/reference/diagnostics#kubb-internal-error) | The bug is in Kubb, not in your config or spec. `--reporter json` also shows the stack. |
| [`KUBB_INVALID_DOCUMENT`](/docs/5.x/reference/diagnostics#kubb-invalid-document) | The check runs even with validation off. A passed `input` must be the spec itself, not an HTML page or a wrapper object. |
| [`KUBB_INVALID_PLUGIN_OPTIONS`](/docs/5.x/reference/diagnostics#kubb-invalid-plugin-options) | See [Invalid plugin options](#invalid-plugin-options). |
| [`KUBB_INVALID_SPEC`](/docs/5.x/reference/diagnostics#kubb-invalid-spec) | [`kubb validate`](/docs/5.x/reference/commands/validate) lists every problem as an error and exits with code 1. `@kubb/adapter-oas` checks while [`validate`](/extensions/kubb-labs/adapter-oas/options#validate) is `true`, the default. The validator does not support OpenAPI 3.2 yet, so a 3.2 document gets this code with a message that it was not validated. |
| [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context) | The composable has no plugin to apply to. The message names the composable. |
| [`KUBB_PATH_TRAVERSAL`](/docs/5.x/reference/diagnostics#kubb-path-traversal) | The refusal stops a crafted spec or a wrong `group.name` from placing files elsewhere on disk. |
| [`KUBB_PERFORMANCE`](/docs/5.x/reference/diagnostics#kubb-performance) | It is never printed as a problem. The time leaves out config loading, format, lint, and post-generate. |
| [`KUBB_PLUGIN_FAILED`](/docs/5.x/reference/diagnostics#kubb-plugin-failed) | The diagnostic names the plugin and keeps the thrown error as its cause. Plugin authors can raise a stable code with [`Diagnostics.Error` or `Diagnostics.report`](/docs/5.x/reference/kit/engine#diagnostics). |
| [`KUBB_PLUGIN_NOT_FOUND`](/docs/5.x/reference/diagnostics#kubb-plugin-not-found) | `kubb init --plugins` also reports it for an id the registry does not list. |
| [`KUBB_PLUGIN_WARNING`](/docs/5.x/reference/diagnostics#kubb-plugin-warning), [`KUBB_PLUGIN_INFO`](/docs/5.x/reference/diagnostics#kubb-plugin-info) | Plugin authors can add a stable code and a location with `Diagnostics.report`. |
| [`KUBB_REF_NOT_FOUND`](/docs/5.x/reference/diagnostics#kubb-ref-not-found) | Inside an `x-` vendor extension it is only a warning. Kubb refuses some local `$ref` files, such as any from a URL input. See [External `$ref` files](/docs/5.x/topics/config-and-inputs#external-refs) for the rules on Kubb Studio agents. |
| [`KUBB_UNKNOWN`](/docs/5.x/reference/diagnostics#kubb-unknown) | The terminal shows no docs link for it. `--reporter file` writes a log with the stack in `.kubb/`. |
| [`KUBB_UNSUPPORTED_FORMAT`](/docs/5.x/reference/diagnostics#kubb-unsupported-format) | Kubb reports each format once, with a count, at the first schema that uses it. |

### Invalid plugin options {#invalid-plugin-options}

When a run stops with [`KUBB_INVALID_PLUGIN_OPTIONS`](/docs/5.x/reference/diagnostics#kubb-invalid-plugin-options), the `plugins` array or a plugin's options cannot work as given. The message names the case:

- `group` with file output: `output.mode: 'file'`, or an `output.path` with an extension.
- `sdk.mode: 'tag'` with file output on `@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`.
- An option value the plugin does not accept.
- A `plugins` entry that is not a plugin, such as `pluginTs` instead of `pluginTs()`.
- The same plugin twice, or a cycle in plugin `dependencies`.
- An extension without `meta.name` or `name`.
- A `@kubb/plugin-faker` `dateParser` that cannot format the adapter's `dateType: 'date'` values.

Change what the message names. A single file has nothing to group or split, so remove `group`, use `sdk.mode: 'flat'`, or write to a directory.
