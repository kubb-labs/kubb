---
layout: doc
title: Parsers
description: defineExtension with kind parser defines a parser from one object
  with meta and a build function. A parser converts a generated file AST into
  the source string written to disk. Covers the Parser interface and adding
  your own.
outline:
  - 2
  - 3
order: 6
navigation:
  title: Parsers
  icon: i-iconoir-code
---

# Parsers

A parser turns a `FileNode` into source code.

> [!TIP]
> For TypeScript and JavaScript output use the built-in [`@kubb/parser-ts`](/extensions/kubb-labs/parser-ts). It is added by default when you import `defineConfig` from the `kubb` package. Build a custom parser only when you target a different language, such as Python, Kotlin, or Rust.

## `defineExtension`

`defineExtension` with `kind: 'parser'` takes a definition object and returns a factory. `build` receives the caller's options, or an empty object when omitted, and returns the parser methods. Declare extensions with `extNames`:

```typescript twoslash [parserText.ts]
import { defineExtension } from 'kubb/kit'

export const parserText = defineExtension({
  kind: 'parser',
  meta: { name: 'text', version: '1.0.0' },
  build() {
    return {
      extNames: ['.txt'],
      parse(file) {
        return file.sources
          .flatMap((source) => source.nodes ?? [])
          .map((node) => (node.kind === 'Text' ? node.value : ''))
          .join('\n')
      },
      print(...nodes) {
        return nodes.map(String).join('\n')
      },
    }
  },
})
```

The parser's `name` comes from `meta.name`. Kubb checks `meta.compatibility` before the build, the same way it does for plugins. See [Extensions](./extensions).

### `defineParser` (deprecated)

> [!WARNING]
> `defineParser` is deprecated. Use `defineExtension` with `kind: 'parser'` instead. The factory form below is removed in the next major.

`defineParser` takes the same definition object as `defineExtension`, without `kind`. To move over, rename the call and add `kind: 'parser'`. See [Extensions](./extensions#define-extension).

Older parsers pass a function that returns the whole parser, `name` included. A parser without `meta` gets `{ name }`. To move over, copy `name` into `meta.name` and return the other fields from `build`:

```typescript twoslash [parserText.ts]
import { defineParser } from 'kubb/kit'

export const parserText = defineParser(() => ({
  name: 'text',
  extNames: ['.txt'],
  parse(file) {
    return file.sources
      .flatMap((source) => source.nodes ?? [])
      .map((node) => (node.kind === 'Text' ? node.value : ''))
      .join('\n')
  },
  print(...nodes) {
    return nodes.map(String).join('\n')
  },
}))
```

The definition object also accepts `setup` as a deprecated alias of `build` when passed to `defineParser`. `defineExtension` takes only `build`.

Wire it into your config:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { parserText } from './parserText.ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  parsers: [parserTs(), parserTsx(), parserText()],
})
```

## Parser anatomy

Every parser the factory returns matches the `Parser` interface from [`kubb/kit`](/docs/5.x/reference/kit). `build` returns every field except `name` and `meta`:

| Property   | Type                                                                      | Required | When called                                  | Purpose                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------- | -------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`     | `string`                                                                  | Yes      |                                              | Unique parser identifier, filled from `meta.name`. Use the output language or format, such as `'typescript'`. |
| `extNames` | `Array<FileNode['extname']> \| undefined`                                 | Yes      |                                              | File extensions this parser handles. Set to `undefined` to register a catch-all fallback.                                                            |
| `parse`    | `(file: FileNode) => string`                                             | Yes      | After all plugins run                        | Serializes the file's sources into the final output string. Must return synchronously.                                                                |
| `print`    | `(...nodes: TNode[]) => string`                                           | Yes      | By plugins, while they generate files        | Renders compiler AST nodes to source text. The node type is parser-specific, for example `ts.Node` for `parserTs`. |
| `copy`     | `(file: FileNode, source: string) => UserFileNode`                        | No       | For each `copy` file                         | Describes a copied template's raw content as nodes, for example its imports as `ImportNode`s, in the same shape `injectFile` takes. Kubb prints the result with `parse`. Omit it to write copied files verbatim. |

> [!IMPORTANT]
> If two parsers register the same extension, the last one in the `parsers` array wins. Order matters.

When no parser matches a file's extension, Kubb writes the file's source strings joined together.

## Parser naming convention

Parsers share the layout of [plugins](/docs/5.x/explanation/extensions#plugins) and [adapters](/docs/5.x/explanation/architecture#adapters):

| Surface             | Pattern                                          | Example                          |
| ------------------- | ------------------------------------------------ | -------------------------------- |
| npm package         | `@<scope>/parser-<name>` or `kubb-parser-<name>` | `@kubb/parser-ts`                |
| Parser runtime name | The output language or format (lowercase)        | `'typescript'`, `'markdown'`     |
| Factory export      | `parser<Name>` (camelCase)                       | `parserTs`, `parserMd`           |

Call the parser factory when registering it in `parsers`.

Parsers compose by extension. `parserTs` (`.ts`, `.js`) and `parserTsx` (`.tsx`, `.jsx`) ship in the same [`@kubb/parser-ts`](/extensions/kubb-labs/parser-ts) package and register side by side.
