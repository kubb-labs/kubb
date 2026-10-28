---
layout: doc
title: kubb generate
description: The generate command runs the Kubb code-generation pipeline based
  on your kubb.config.ts.
outline:
  - 2
  - 3
order: 2
navigation:
  title: kubb generate
  icon: i-iconoir-play
---

# kubb generate

Run `kubb generate` to read your [`kubb.config.ts`](/docs/5.x/reference/configuration) and run the code-generation pipeline. It's the default command, so running `kubb` with no arguments does the same.


## Usage

Generate from the input set in your config:

```shell [Terminal]
kubb generate
```

Pass an input file to override the config:

```shell [Terminal]
kubb generate ./petStore.yaml
```

## Arguments

| Argument  | Description                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- |
| `[input]` | Optional path, URL, or git input (`git+<repo>#<ref>:<path>`) of a Swagger/OpenAPI document. Overrides the `input` set in the config. |

## Options

| Option                                       | Default | Description                                                                |
| -------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| `--config=<path>`, `-c <path>`               |         | Path to a config file, such as `./kubb.staging.ts`.                       |
| `--log-level=<silent\|info\|verbose>`, `-l`  | `info`  | Set the verbosity. Use `verbose` to see plugin timings.                   |
| `--silent`, `-s`                             | `false` | Force the log level to `silent`. Suppresses output.                       |
| `--verbose`                                  | `false` | Force the log level to `verbose`. Shows slow plugins.                     |
| `--reporter=<cli\|json\|file\|html>`        |         | Pick which reporters to trigger, comma-separated. Defaults to `cli`.      |
| `--watch`, `-w`                              | `false` | Re-run the pipeline whenever the local input file changes.                |
| `--dry-run`                                  | `false` | Preview a run without writing files, formatting, linting, or running post-generate commands. The summary shows planned file changes compared with disk. |

`--reporter` takes no short flag. The camelCase spellings from v4 (`--logLevel`, `--dryRun`) still work and print a deprecation warning.

`--watch` follows a local `input` file only. A URL or git input is generated once, so rerun Kubb after the remote spec changes.

A config file that exports several entries generates them in parallel, on one worker process per CPU core, the largest local input first. Each entry's output prints in config order once it is done. `--watch` generates the entries one after another. Entries that write to the same output folder should not count on running in order.

In `--watch` mode, each rebuild line shows the duration and the schemas and operations the spec gained or lost; the summary below it lists the files it added, modified, or removed. In an interactive terminal, press `r` to rebuild and `q` to quit.

## Reporters

A reporter decides how a run is rendered. The config registers available reporters with [`reporters`](/docs/5.x/reference/configuration). `--reporter` picks which ones to trigger by name, comma-separated (`--reporter cli,file`). Four reporters are registered by default.

The CLI summary starts with the outcome and duration, then labels plugin results and the output path. Files with unchanged content are counted separately, including when `output.clean` rewrites the output directory.

```text [Summary]
✓ Generation complete  466ms

  17 files generated · 54 unchanged
  Plugins  4 passed
  Output   ./src/gen

File changes
  14 added · 3 modified · 1 deleted
  Lines  +312 −47
```

File changes compare filesystem output with its contents before the run. Custom storage drivers omit this section. Line totals compare counts of each line, so moving a line within a file does not count as a removal and addition. With `--dry-run`, the summary says “planned” and “Nothing was written.” Plain terminals and AI agent sessions show the same summary.

| Reporter | Output                                                                          |
| -------- | ------------------------------------------------------------------------------- |
| `cli`    | The end-of-run summary in the terminal. Default. Uses plain text in non-interactive terminals and AI agent sessions. |
| `json`   | A machine-readable report on stdout for CI. See [Diagnostics](/docs/5.x/reference/diagnostics#machine-readable-output) for the full JSON shape. |
| `file`   | The run's diagnostics, written to `.kubb/kubb[-<name>]-<timestamp>.log`. The `<name>` segment is dropped when the config has no `name`. A run without diagnostics writes no file. |
| `html`   | A browsable report directory with generated files and diagnostics, written to `.kubb/kubb[-<name>]-<timestamp>/index.html`. |

Write a log file:

```shell [Terminal]
kubb generate --reporter file
```

Print a JSON report for CI. The exit code is non-zero on any error:

```shell [Terminal]
kubb generate --reporter json
```
