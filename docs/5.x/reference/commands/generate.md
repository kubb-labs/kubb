---
layout: doc
title: kubb generate - Generate code from your API spec
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

| Argument | What it does |
| --- | --- |
| `[input]` | Path, URL, or git input (`git+<repo>#<ref>:<path>`) of a Swagger or OpenAPI document. Overrides the config's [`input`](/docs/5.x/reference/configuration#input). |

## Options

| Flag | Alias | Default | What it does |
| --- | --- | --- | --- |
| `--config <path>` | `-c` | | Path to a config file, such as `./kubb.staging.ts`. |
| `--log-level <level>` | `-l` | `info` | `silent`, `info`, or `verbose`. `verbose` shows plugin timings. |
| `--silent` | `-s` | `false` | Same as `--log-level silent`. |
| `--verbose` | | `false` | Same as `--log-level verbose`. |
| `--reporter <names>` | | `cli` | Comma-separated [reporters](#reporters) to run: `cli`, `json`, `file`, `html`. |
| `--watch` | `-w` | `false` | Generate again when the local `input` file changes. |
| `--dry-run` | | `false` | Preview the run. Writes no files and skips formatting, linting, and `output.postGenerate`. |

### Watch mode

`--watch` follows a local `input` file only. A URL or git input is generated once, so rerun Kubb after the remote spec changes. In an interactive terminal, press `r` to rebuild and `q` to quit. See [Watch mode](/docs/5.x/topics/cli-runs#watch-mode).

## Reporters

A reporter decides how a run is shown. All four are registered by default through the config's [`reporters`](/docs/5.x/reference/configuration#reporters), and `--reporter` picks which of them run.

| Reporter | Output |
| --- | --- |
| `cli` | The end-of-run summary in the terminal. Plain text in non-interactive terminals and AI agent sessions. |
| `json` | A machine-readable report on stdout for CI. The run log goes to stderr. See [Diagnostics](/docs/5.x/reference/diagnostics#machine-readable-output) for the shape. |
| `file` | The summary, plugin timings, and problems in `.kubb/kubb[-<name>]-<timestamp>.log`. `<name>` is the config's `name`, if set. |
| `html` | A browsable report of the generated files and diagnostics in `.kubb/kubb[-<name>]-<timestamp>/index.html`. |

```shell [Terminal]
kubb generate --reporter file       # write a log file
kubb generate --reporter json       # print a JSON report for CI
kubb generate --reporter cli,html   # run two reporters
```

The `cli` summary shows the outcome and duration, the plugin results, the output path, and the file changes:

```text [Summary]
✓ Generation complete  466ms

  17 files generated · 54 unchanged
  Plugins  4 passed
  Output   ./src/gen

File changes
  14 added · 3 modified · 1 deleted
  Lines  +312 −47
```

See [Read the run summary](/docs/5.x/topics/cli-runs#run-summary).

## Exit codes

| Code | When |
| --- | --- |
| `0` | The run succeeds. |
| `1` | The config fails to load, or any config fails to generate. One failing config does not stop the others. |
