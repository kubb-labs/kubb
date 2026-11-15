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

`kubb validate` checks your spec with the adapter in your Kubb config and generates nothing. Run it in CI or before you commit a spec change.

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

On failure, it prints the validation error. When `@kubb/adapter-oas` is needed but missing, it prints the install command.

## Arguments

| Argument | Required | What it does |
| --- | --- | --- |
| `<input>` | Yes | Path, URL, or git input of the spec, such as `https://petstore3.swagger.io/api/v3/openapi.json`. See [`input`](/docs/5.x/reference/configuration#input) for the format. |

## Options

| Flag | Alias | Default | What it does |
| --- | --- | --- | --- |
| `--config <path>` | `-c` | | Path to the Kubb config. Without it, Kubb looks for one the way [`kubb generate`](/docs/5.x/reference/commands/generate) does. |

```shell [Terminal]
kubb validate ./schema.graphql --config ./kubb.config.ts
```

## Which adapter runs

| Situation | Adapter |
| --- | --- |
| A config is found or passed | The adapter of each config entry. |
| No config | `@kubb/adapter-oas`, for OpenAPI and Swagger documents. |

See [Config loading](/docs/5.x/reference/configuration#config-loading).

## Exit codes

| Code | When |
| --- | --- |
| `0` | The spec is valid. |
| `1` | The spec is invalid, a config entry has no adapter, or the adapter is not installed. |
