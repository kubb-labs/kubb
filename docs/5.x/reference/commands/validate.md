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
  - ✅ Validation success
---
::

The input can also be a URL, such as `https://petstore3.swagger.io/api/v3/openapi.json`.

## Arguments

| Argument  | Required | Description                                              |
| --------- | -------- | -------------------------------------------------------- |
| `<input>` | `true`   | Path or URL to the Swagger/OpenAPI document to validate. |

> [!TIP]
> `kubb validate` exits with a non-zero status code when the spec is invalid. Use it as a pre-commit hook or CI step to fail the build.

## See also

- [Adapters](/extensions/kind/adapters): OAS adapter that parses the validated spec
- [Generate your first client](/docs/5.x/tutorials/quickstart): end-to-end walkthrough
