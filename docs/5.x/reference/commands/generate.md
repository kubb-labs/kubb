---
layout: doc
title: kubb generate
description: The generate command runs the Kubb code-generation pipeline from your kubb.config.ts, with watch mode, dry runs, and cli, json, file, and html reporters.
outline:
  - 2
  - 3
order: 2
navigation:
  title: kubb generate
  icon: i-iconoir-play
---

# kubb generate

`kubb generate` reads your [`kubb.config.ts`](/docs/5.x/reference/configuration) and runs the code-generation pipeline. It is the default command, so `kubb` alone does the same.

```shell [Terminal]
kubb generate                  # input from the config
kubb generate ./petStore.yaml  # this spec instead
```

## Arguments

| Argument | Description |
| --- | --- |
| `[input]` | Path, URL, or git input (`git+<repo>#<ref>:<path>`) of a Swagger or OpenAPI document. Overrides the config's [`input`](/docs/5.x/reference/configuration#input). |

## Options

| Option | Default | Description |
| --- | --- | --- |
| `--config <path>`, `-c` | | Path to a config file, such as `./kubb.staging.ts`. |
| `--log-level <level>`, `-l` | `info` | `silent`, `info`, or `verbose`. `verbose` shows plugin timings. |
| `--silent`, `-s` | `false` | Same as `--log-level silent`. |
| `--verbose` | `false` | Same as `--log-level verbose`. |
| `--reporter <names>` | `cli` | Comma-separated [reporters](#reporters) to run: `cli`, `json`, `file`, `html`. No short flag. |
| `--watch`, `-w` | `false` | Generate again whenever the local `input` file changes. |
| `--dry-run` | `false` | Preview a run without writing files, formatting, linting, or running `output.postGenerate`. The summary shows the planned file changes. |

### Watch mode

`--watch` follows a local `input` file only. A URL or git input is generated once, so rerun Kubb after the remote spec changes.

Each rebuild line shows the duration and the schemas and operations the spec gained or lost. The summary below it lists the files the rebuild added, modified, or removed. In an interactive terminal, press `r` to rebuild and `q` to quit.

## Reporters

A reporter decides how a run is rendered. The config registers the available ones with [`reporters`](/docs/5.x/reference/configuration#reporters), and all four below are registered by default. `--reporter` picks which of them run.

| Reporter | Output |
| --- | --- |
| `cli` | The end-of-run summary in the terminal. Plain text in non-interactive terminals and AI agent sessions. |
| `json` | A machine-readable report on stdout for CI. The run log goes to stderr. See [Diagnostics](/docs/5.x/reference/diagnostics#machine-readable-output) for the shape. |
| `file` | The summary, plugin timings, and problems in `.kubb/kubb[-<name>]-<timestamp>.log`. `<name>` is the config's `name`, left out when it has none. |
| `html` | A browsable report with the generated files and diagnostics in `.kubb/kubb[-<name>]-<timestamp>/index.html`. |

```shell [Terminal]
kubb generate --reporter file       # write a log file
kubb generate --reporter json       # print a JSON report for CI
kubb generate --reporter cli,html   # run two reporters
```

The `cli` summary starts with the outcome and duration, then the plugin results and the output path:

```text [Summary]
✓ Generation complete  466ms

  17 files generated · 54 unchanged
  Plugins  4 passed
  Output   ./src/gen

File changes
  14 added · 3 modified · 1 deleted
  Lines  +312 −47
```

- **Unchanged** counts files whose content did not change, also when `output.clean` rewrites the folder.
- **File changes** compares the output on disk with its content before the run. Custom storage drivers leave this section out.
- **Lines** compares the count of each line, so moving a line inside a file is not a removal plus an addition.
- With `--dry-run`, the summary says "planned" and "Nothing was written."

## Exit codes

`kubb generate` exits with code 1 when the config fails to load or any config fails to generate. One failing config does not stop the others.
