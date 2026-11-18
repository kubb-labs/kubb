# Markdown

The Markdown parser writes the `.md` and `.markdown` files that plugins generate, with YAML frontmatter from each file's `meta.frontmatter`.

It joins each file's source blocks with blank lines and writes the frontmatter above the content.

## Setup

No setup is needed. `defineConfig` and the bundler integrations register `parserMd()` by default, next to `parserTs()` and `parserTsx()`.

> [!WARNING]
> A custom `parsers` array replaces the default set, so add `parserMd()` to it yourself and list every parser your plugins need. A file that no parser claims is written as its source text only, without imports, exports, banner, or footer.

## Options worth knowing

The parser takes no options. A plugin controls the output per file:

| File setting                                                                              | Default | What it does                                                       |
| ----------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------ |
| [`meta.frontmatter`](https://kubb.dev/extensions/kubb-labs/parser-md/options#frontmatter) | None    | Writes the object as YAML frontmatter. `null` or `{}` writes none. |
| `banner`                                                                                  | None    | Goes above the frontmatter.                                        |
| `footer`                                                                                  | None    | Goes below the content.                                            |

## Example

This config sets a custom `parsers` array that keeps the Markdown parser. A plugin file with `meta.frontmatter` then prints like this:

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { parserMd } from '@kubb/parser-md'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  parsers: [parserTs(), parserTsx(), parserMd()],
  plugins: [pluginTs()],
})
```

```md [src/gen/README.md]
---
title: API Reference
layout: doc
---

Endpoints generated from the OpenAPI spec.
```

::
