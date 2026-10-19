---
layout: doc
title: kubb validate
description: The validate command checks that a Swagger/OpenAPI document is
  valid without running the full pipeline.
outline:
  - 2
  - 3
order: 3
navigation:
  title: kubb validate
  icon: i-iconoir-check-circle
---

# kubb validate

Run `kubb validate` to check that a Swagger/OpenAPI document is valid without running the pipeline. Use it to catch errors early in CI or before you commit a spec change.

::terminal
---
command: kubb validate ./petStore.yaml
output:
  - ✓ Validation passed  84ms
  - ''
  - '  1 specification validated'
  - '  Input    ./petStore.yaml'
  - '  Adapter  @kubb/adapter-oas'
---
::

The input can also be a URL, such as `https://petstore3.swagger.io/api/v3/openapi.json`.

The summary shows the result and elapsed time before the input and validation adapter. Validation runs no generator plugins and writes no generated files. A failure includes the validation error; a missing adapter includes its installation command.

## Arguments

| Argument  | Required | Description                                              |
| --------- | -------- | -------------------------------------------------------- |
| `<input>` | `true`   | Path or URL to the Swagger/OpenAPI document to validate. |

> [!TIP]
> `kubb validate` exits with a non-zero status code when the spec is invalid. Use it as a pre-commit hook or CI step to fail the build.
