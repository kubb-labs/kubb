---
layout: doc
title: Kit API
description: The kubb/kit reference for authoring plugins, generators,
  resolvers, renderers, adapters, parsers, and storage backends, plus the ast
  namespace, Diagnostics, and the engine surface.
outline:
  - 2
  - 3
order: 4
navigation:
  title: Kit
  icon: i-iconoir-tools
---

# Kit API

Import authoring APIs from `kubb/kit`, included with the `kubb` package.

## Big concepts

| Concept                                        | Entry point                                   | What it does                                                                                                |
| ---------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [Plugins](./kit/plugins)                       | `defineExtension` (`kind: 'plugin'`)          | The main extension point. Owns file naming, the output folder, and the lifecycle hooks.                     |
| [Generators](./kit/generators)                 | `defineGenerator`                             | Walks the AST and emits files. A plugin registers one or more.                                              |
| [Resolvers](./kit/resolvers)                   | `createResolver`                              | Decides file names and output paths. Other plugins read them by name.                                       |
| [Renderers](/docs/5.x/reference/jsx#renderers) | `createRenderer`, `jsxRenderer`               | Turns the elements a generator returns into `FileNode`s.                                                    |
| [Adapters](./kit/adapters)                     | `defineExtension` (`kind: 'adapter'`)         | Converts an input spec into the universal AST every plugin reads.                                           |
| [Parsers](./kit/parsers)                       | `defineExtension` (`kind: 'parser'`)          | Turns a `FileNode` into the source string written to disk.                                                  |
| [Extensions](./kit/extensions)                 | `defineExtension`, `meta`, `dependencies`     | What plugins, adapters, and parsers share: `kind`, identity, compatibility ranges, and plugin dependencies. |
| [Storage](./kit/storage)                       | `createStorage`, `fsStorage`, `memoryStorage` | Decides where generated files land.                                                                         |

## Other parts

| Part                                   | Entry point                 | What it does                                                                     |
| -------------------------------------- | --------------------------- | -------------------------------------------------------------------------------- |
| [AST and node builders](./kit/ast)     | `ast`                       | The namespace behind `factory` builders, visitors, guards, macros, and printers. |
| [Text](#text)                          | `text`                      | Quotes strings and indents source text for any language.                         |
| [Engine](./kit/engine)                 | `createKubb`, `Diagnostics` | The `kubb`-package surface that runs your plugins and the errors it collects.    |
| [Lifecycle hooks](./kit/hooks)         | `KubbHooks`                 | Every `kubb:*` hook a build fires, its payload, and when it fires.               |
| [Extension manifest](./kit/manifest)   | `kubb-extension.json`       | The file an extension package ships for the registry, `kubb add`, and Studio.    |
| [Extension docs](./kit/extension-docs) | `docs/`                     | The Markdown pages an extension ships for kubb.dev.                              |

## Casing

`casing` turns names from a spec into identifiers and file names. Every helper takes `{ prefix, suffix }` except `capitalize`.

| Helper                  | Example                                 |
| ----------------------- | --------------------------------------- |
| `casing.camel`          | `'get pet-by id'` gives `'getPetById'`. |
| `casing.pascal`         | `'get pet-by id'` gives `'GetPetById'`. |
| `casing.snake`          | `'helloWorld'` gives `'hello_world'`.   |
| `casing.screamingSnake` | `'helloWorld'` gives `'HELLO_WORLD'`.   |
| `casing.capitalize`     | `'getPetById'` gives `'GetPetById'`.    |

`camelCase` and `pascalCase` from `kubb/kit` are deprecated. Use `casing.camel` and `casing.pascal`.

## Text

`text` holds helpers that work for any output language, so a quote or line break in a spec name cannot break the output.

| Helper         | Purpose                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------ |
| `text.quote`   | A single-quoted string literal with quotes, backslashes, and line breaks escaped.                |
| `text.indent`  | Indent every non-empty line of `text` by `unit` (two spaces by default). Blank lines stay empty. |
| `text.dedent`  | Strip the common leading whitespace and the blank lines around the text.                         |
| `text.unquote` | Strip one matching pair of `"`, `'` or `` ` `` from both ends.                                   |

```typescript [text.ts]
import { text } from 'kubb/kit'

const line = `method: ${text.quote("o'clock")}` // method: 'o\'clock'
```
