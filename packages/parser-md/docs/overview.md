# Markdown

The Markdown parser writes the `.md` and `.markdown` files that plugins generate. It joins each file's source blocks with blank lines and, when the file sets `meta.frontmatter`, writes that object as YAML frontmatter above the content.

## Setup

No setup is needed. `defineConfig` and the bundler integrations register `parserMd()` by default, next to `parserTs()` and `parserTsx()`.

Add it yourself only when you set a custom `parsers` array, because that array replaces the default set. List every parser your plugins need. A file that no parser claims is written as its source text only, without imports, exports, banner, or footer.

## Options worth knowing

The parser takes no options. A plugin controls the output per file:

| File setting                                                                              | Default | What it does                                                       |
| ----------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------ |
| [`meta.frontmatter`](https://kubb.dev/extensions/kubb-labs/parser-md/options#frontmatter) | None    | Writes the object as YAML frontmatter. `null` or `{}` writes none. |
| `banner`                                                                                  | None    | Goes above the frontmatter.                                        |
| `footer`                                                                                  | None    | Goes below the content.                                            |

## Example

The config below sets a custom `parsers` array and keeps the Markdown parser in it. A plugin file with `meta.frontmatter` set then prints like this:

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
