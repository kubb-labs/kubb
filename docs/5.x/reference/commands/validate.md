---
layout: doc
title: kubb validate - Check an API spec
description: The validate command checks a specification with the adapter in your Kubb config, or the OpenAPI adapter without one, and runs no generation.
outline:
  - 2
  - 3
order: 3
navigation:
  title: kubb validate
  icon: i-iconoir-check-circle
---

# kubb validate

`kubb validate` checks a specification with the adapter in your Kubb config and runs no generator plugins. Use it in CI or before you commit a spec change.

::terminal
---
command: kubb validate ./petStore.yaml
output:
  - ✓ Validation passed  84ms
  - ''
  - '  1 specification validated'
  - '  Input    ./petStore.yaml'
  - '  Adapter  oas'
---
::

A failure shows the validation error instead. When the default OpenAPI adapter is missing, the error includes its install command.

## Arguments

| Argument | Required | Description |
| --- | --- | --- |
| `<input>` | Yes | Path, URL, or git input (`git+<repo>#<ref>:<path>`) of the spec, such as `https://petstore3.swagger.io/api/v3/openapi.json`. See [`input`](/docs/5.x/reference/configuration#input) for the format. |

Kubb fetches a git input into a temporary folder with `git`, validates it, and deletes the folder.

## Options

| Option | Description |
| --- | --- |
| `--config <path>`, `-c` | Path to the Kubb config. Without it, Kubb looks for one the way [`kubb generate`](/docs/5.x/reference/commands/generate) does. |

```shell [Terminal]
kubb validate ./schema.graphql --config ./kubb.config.ts
```

## Which adapter runs

| Situation | Adapter |
| --- | --- |
| A config is found or passed | The adapter of each config entry. A local path resolves from that entry's `root`, or the current folder without one. A URL or git input is passed unchanged. |
| A config entry has no adapter | None. The command fails instead of using the OpenAPI adapter. |
| No config, or a found config that fails to load | `@kubb/adapter-oas`, for OpenAPI and Swagger documents. A config passed with `--config` that fails to load fails the command. |

## Exit codes

`kubb validate` exits with code 1 when the spec is invalid, no adapter is configured, or the adapter is missing. Use it as a pre-commit hook or CI step to fail the build.
