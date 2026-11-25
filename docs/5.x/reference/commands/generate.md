---
layout: doc
title: kubb generate - Generate code from your API spec
description: The generate command runs the Kubb code-generation pipeline from your kubb.config.ts, with watch mode, dry runs, a CI check, and cli, json, file, and html reporters.
outline:
  - 2
  - 3
order: 2
navigation:
  title: kubb generate
  icon: i-iconoir-play
---

# kubb generate

`kubb generate` turns your spec into code with the plugins in your [`kubb.config.ts`](/docs/5.x/reference/configuration). It is the default command: `kubb` alone runs it.

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
| `--check` | | `false` | Compare the output with the files on disk and write nothing to `output.path`. Exits with `1` when a file is out of date. See [Check mode](#check-mode). |
| `--diff` | | `false` | Print a diff for each out-of-date file. Turns `--check` on. |

### Watch mode

`--watch` watches only a local `input` file. A URL or git input generates once, so run Kubb again when the remote spec changes. In an interactive terminal, press `r` to rebuild and `q` to quit. See [Watch mode details](#watch-mode-details).

### Check mode {#check-mode}

`--check` tells you whether a run would change the generated files on disk, and writes nothing to `output.path`. Use it in CI to fail a pipeline when someone changed the spec or the config and did not commit the new output. `--diff` also prints what would change.

```shell [Terminal]
kubb generate --check          # exit 1 when a file is out of date
kubb generate --check --diff   # also print what would change
```

[Check generated code in CI](/docs/5.x/how-to/recipes#check-generated-code-in-ci) has the workflows. See [Check mode details](#check-mode-details) and [Exit codes](#exit-codes).

## Reporters

A reporter decides how you see a run. The config's [`reporters`](/docs/5.x/reference/configuration#reporters) registers all four by default, and `--reporter` picks which ones run.

| Reporter | Output |
| --- | --- |
| `cli` | The end-of-run summary in the terminal. Plain text in non-interactive terminals and AI agent sessions. |
| `json` | A machine-readable report on stdout for CI. The run log goes to stderr. See [Machine-readable output](/docs/5.x/reference/diagnostics#machine-readable-output) for the shape. |
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

See [Run summary](#run-summary).

## Exit codes

| Code | Without `--check` | With `--check` or `--diff` |
| --- | --- | --- |
| `0` | The run succeeds. | The files on disk are up to date. |
| `1` | The config fails to load, or any config fails to generate. | A file would be added, modified, or deleted. |
| `2` | | The config fails to load, or any config fails to generate. |

One failing config does not stop the others.

## Less common cases {#less-common-cases}

### Watch mode details {#watch-mode-details}

With `kubb generate --watch`, Kubb watches only a local `input` file. A URL or git input generates once, so run Kubb again when the remote spec changes. Kubb does not watch the files the input references with `$ref`, such as `schemas/Pet.yaml`. After you edit one, press `r` or run Kubb again.

| Event | What happens |
| --- | --- |
| The first build fails | Kubb keeps watching, so you can fix the input. |
| A rebuild ends | A line shows the duration and the schemas and operations the spec gained or lost. The summary below it lists the files the rebuild added, modified, or removed. |
| You press `r` | Kubb rebuilds. Keys work in an interactive terminal. |
| You press `q` | Kubb quits with exit code 0. |
| You press Ctrl+C | Kubb quits with exit code 130. |

To keep `clean` off during incremental runs, pass a function to `defineConfig` and read `watch`. See [Config function](/docs/5.x/reference/configuration#config-function).

#### Adapter sources

When you write an adapter, its `sources` member lists the files and URLs the last `parse()` read, even unreadable ones. A watcher can rebuild when one of them changes, but `kubb generate --watch` does not read them. See [Adapters](/docs/5.x/reference/kit/adapters).

### Check mode details {#check-mode-details}

Kubb generates into a temporary folder inside the project root, runs `output.format` and `output.lint` there, and compares the result with `output.path`. It then deletes the folder.

```text [Summary]
✗ Generated code is out of date  412ms

  1 file out of date · 70 unchanged
  Plugins  4 passed
  Target   ./src/gen
  Nothing was written.

Planned file changes
  0 added · 1 modified · 0 deleted
  Lines  +2 −1
  modified: src/gen/types/Pet.ts
```

| Status | What a run would do |
| --- | --- |
| `added` | Create the file. It is missing on disk. |
| `modified` | Rewrite the file. Its content on disk differs. |
| `deleted` | Remove the file. Only listed with [`output.clean`](/docs/5.x/reference/configuration#outputclean), which removes files Kubb no longer generates. |

With `--reporter json`, each report holds `check.changed` and `check.files`. `--diff` then prints to stderr. See [Machine-readable output](/docs/5.x/reference/diagnostics#machine-readable-output).

`--check` differs from `--dry-run`:

| | `--dry-run` | `--check` |
| --- | --- | --- |
| Exit code when files would change | `0` | `1` |
| Runs `output.format` and `output.lint` | No | Yes, on the temporary folder |
| Needs the cache in `node_modules/.cache/kubb` to recognize formatted output | Yes | No |

`--check` has these limits:

- It cannot run with `--watch`. With `--dry-run`, it behaves like `--check` alone.
- `output.postGenerate` does not run. Its commands name their own paths, so they would write to the real output.
- `output.path`, `shared.path`, and every file a plugin writes must sit inside `root`, and the config must use the default `fs` storage.

> [!WARNING]
> A formatter or linter rule that names the output folder from the project root, such as an override for `src/gen/**`, does not apply to the temporary folder `.kubb-check-<random>/src/gen`. The check then reports formatting differences. Use a pattern such as `**/gen/**`.

### Run summary {#run-summary}

When a run ends, the `cli` reporter prints a summary. It starts with the outcome and duration, then the plugin results and the output path.

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
