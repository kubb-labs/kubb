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
| `--check` | | `false` | Compare the output with the files on disk and write nothing. Exits with `1` when a file is out of date. See [Check mode](#check-mode). |
| `--diff` | | `false` | Print a diff for each out-of-date file. Turns `--check` on. |
| `--force` | | `false` | Generate, format, and lint even when the run is [up to date](#up-to-date-runs). |

### Watch mode

`--watch` watches only a local `input` file. A URL or git input generates once, so run Kubb again when the remote spec changes. In an interactive terminal, press `r` to rebuild and `q` to quit. See [Watch mode details](#watch-mode-details).

### Check mode {#check-mode}

`--check` tells you whether a run would change the generated files on disk, and writes nothing. Use it in CI to fail a pipeline when someone changed the spec or the config and did not commit the new output. `--diff` also prints what would change.

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

Kubb generates in memory and compares each file with the one on disk. It writes nothing and runs no formatter or linter.

A formatter rewrites what Kubb generates, so the generated text and the file on disk often differ. [`kubb-lock.yml`](#kubb-lock) records what each generated file became after `output.format`, `output.lint`, and `output.postGenerate`. A file is up to date when:

- the file on disk holds the generated text, or
- `kubb-lock.yml` lists the file, and its two hashes equal the hash of the generated text and the hash of the file on disk.

Without `output.format`, `output.lint`, and `output.postGenerate`, the check needs no `kubb-lock.yml`.

```text [Out of date]
✗ Generated code is out of date  412ms

  3 files out of date · 70 unchanged
  Plugins  4 passed
  Target   ./src/gen

Out-of-date files
  modified  src/gen/types/Pet.ts    +2 −1
  added     src/gen/types/Order.ts  +14 −0
  deleted   src/gen/types/Tag.ts    +0 −3

  1 added · 1 modified · 1 deleted
  Run `kubb generate` to update them.
```

Each row shows the status, the path from `root`, and the lines a run would add and remove. When every file is up to date, the summary stays short:

```text [Up to date]
✓ Generated code is up to date  407ms

  71 files checked
  Plugins  4 passed
  Target   ./src/gen
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
| Lists each out-of-date file with its path | No | Yes |
| Prints a diff with `--diff` | No | Yes |

`--dry-run` and `--check` run no formatter or linter. Each reads `kubb-lock.yml` to recognize formatted output.

`--check` has these limits:

- It cannot run with `--watch`. With `--dry-run`, it behaves like `--check` alone.
- The config must use the default `fs` storage.
- With `output.format`, `output.lint`, or `output.postGenerate`, the line counts and `--diff` compare the file on disk with the code before those steps ran. A changed file can show more changed lines than a run would write.
- A new formatter version or formatter config does not make the check fail. Run `kubb generate --force` after you change one.

### Up-to-date runs {#up-to-date-runs}

`kubb generate` skips the build when nothing it reads has changed since the last run. It prints "Up to date" and exits with `0`. Pass `--force` to generate anyway.

A run is up to date when all of these match [`kubb-lock.yml`](#kubb-lock):

- The config, with the source of every function in it.
- The spec, and every local file it references with `$ref`.
- The version of Kubb and of every package in the `dependencies` and `devDependencies` of each `package.json` from `root` up.
- Every generated file on disk.

Kubb always generates in these cases:

- The input is a URL or a git input, or the spec references a URL. Kubb cannot compare those without fetching them.
- The adapter does not list the files it read, or no `package.json` exists in `root` or above it.
- The config sets `output.postGenerate`.
- The config uses a storage other than `fs`.
- You pass `--watch`, `--check`, `--dry-run`, or a reporter other than `cli`.

> [!WARNING]
> Kubb does not see a change in a file that your config imports, such as a helper module or a plugin you develop locally under the same version. It also does not see a change in your formatter's or linter's config file. Run `kubb generate --force` after you edit one.

A run that still generates, such as one with `--reporter json`, skips `output.format` and `output.lint` when nothing it reads changed and every file comes out unchanged. `--force` runs them.

### `kubb-lock.yml` {#kubb-lock}

`kubb generate` writes `kubb-lock.yml` to `root` on every run that writes files. It lists every generated file. Commit it with the generated files.

`--check` and `--dry-run` read it, so they work on a fresh checkout without running a formatter.

```yaml [kubb-lock.yml]
lockfileVersion: 1
inputs:
  src/gen:
    hash: 0c3bf1dc…
    sources:
      - openapi.yaml
files:
  src/gen/types/Pet.ts:
    source: 647596c2…
    output: 002220b7…
```

| Field | Value |
| --- | --- |
| `lockfileVersion` | The format version. Kubb ignores a file with another version. |
| `inputs` | What each config last generated from, keyed by the config's `name`, or its `output.path` without one. Left out for an input Kubb cannot compare, such as a URL. |
| `hash` | SHA-256 hash of the config, the package versions, and the content of the `sources`. Line endings count as `\n`. |
| `sources` | The spec and the local files it references, as paths from `root`. |
| `files` | One entry per generated file, keyed by its path from `root`. |
| `source` | SHA-256 hash of the code Kubb generated. |
| `output` | SHA-256 hash of the file on disk after `output.format`, `output.lint`, and `output.postGenerate`. Line endings count as `\n`. |

- Do not edit `kubb-lock.yml`. After a merge conflict, run `kubb generate` and commit the result.
- When `--check` finds formatted output and no `kubb-lock.yml`, it exits with `1` and tells you to run `kubb generate`.

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
