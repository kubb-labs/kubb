---
layout: doc
title: kubb validate
description: The validate command checks a specification with the configured adapter
  without running the generation pipeline.
outline:
  - 2
  - 3
order: 3
navigation:
  title: kubb validate
  icon: i-iconoir-check-circle
---

# kubb validate

Run `kubb validate` to check a specification with the adapter in your Kubb config, without running generation. Use it to catch errors early in CI or before you commit a spec change. Without a config, it uses `@kubb/adapter-oas` for OpenAPI and Swagger documents.

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

The input can also be a URL, such as `https://petstore3.swagger.io/api/v3/openapi.json`.

The summary shows the result and elapsed time before the input and the adapter's name. Validation runs no generator plugins and writes no generated files. A failure includes the validation error. When the default OpenAPI adapter is missing, the error includes its installation command.

The command discovers the project's config or accepts `--config <path>` (`-c`). Each config's adapter validates the supplied input, with local paths resolved from that config's `root`, or the current directory when `root` is omitted. A URL is passed unchanged. A config without an adapter fails instead of substituting the OpenAPI adapter.

```shell [Terminal]
kubb validate ./schema.graphql --config ./kubb.config.ts
```

## Arguments

| Argument  | Required | Description                                              |
| --------- | -------- | -------------------------------------------------------- |
| `<input>` | `true`   | Path or URL to the specification to validate. |

> [!TIP]
> `kubb validate` exits with a non-zero status code when the spec is invalid. Use it as a pre-commit hook or CI step to fail the build.
