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

> [!TIP]
> For TypeScript and JavaScript output, use [`@kubb/parser-ts`](/extensions/kubb-labs/parser-ts). When the config sets no `parsers`, `defineConfig` adds `parserTs()`, `parserTsx()`, and `parserMd()`. Write your own only for another language, such as Python, Kotlin, or Rust.

A parser turns a `FileNode` into the source text Kubb writes. `build` gets the user's options and returns the parser methods: Define one with [`defineExtension`](/docs/5.x/reference/kit/extensions#define-extension) and `kind: 'parser'`. [`meta`](/docs/5.x/reference/kit/extensions#meta) and the [factory statics](/docs/5.x/reference/kit/extensions#factory-statics) work the same for every extension.

```typescript [parserText.ts]
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

A `parsers` array replaces the defaults, so list them again to keep TypeScript and Markdown output:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { parserMd } from '@kubb/parser-md'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { parserText } from './parserText.ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  parsers: [parserTs(), parserTsx(), parserMd(), parserText()],
})
```

`build` returns these members:

| Member     | Type                                               | Required | Called                              | Purpose                                                                                                                                         |
| ---------- | -------------------------------------------------- | -------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `extNames` | `Array<FileNode['extname']> \| undefined`          | Yes      |                                     | The file extensions this parser handles. With `undefined`, `parse` never runs.                                                                |
| `parse`    | `(file: FileNode) => string`                       | Yes      | After every plugin, once per file   | Prints the file's sources. Must be synchronous.                                                                                                 |
| `print`    | `(...nodes: TNode[]) => string`                    | Yes      | By plugins, while they generate     | Prints compiler AST nodes, such as `ts.Node` for `parserTs`.                                                                                    |
| `inline`   | `InlineLanguage`                                   | No       | Before barrels, for inline sources  | Finds names (`replaceIdentifiers`) and makes a definition safe to put where a name was (`wrap`), so files of this parser can absorb inline sources. `parserTs` has it. |
| `copy`     | `(file: FileNode, source: string) => UserFileNode` | No       | For each `copy` file                | Describes a copied template as nodes, such as its imports as `ImportNode`s, for `parse` to print. Without it, Kubb copies the file as is.        |

> [!IMPORTANT]
> When two parsers register the same extension, the last one in the `parsers` array wins.

When no parser handles a file's extension, Kubb writes its sources joined together.

## Parser naming {#parser-naming}

| Surface        | Pattern                                          | Example                      |
| -------------- | ------------------------------------------------ | ---------------------------- |
| npm package    | `@<scope>/parser-<name>` or `kubb-parser-<name>` | `@kubb/parser-ts`            |
| `meta.name`    | The output language or format, in lowercase      | `'typescript'`, `'markdown'` |
| Factory export | `parser<Name>`                                   | `parserTs`, `parserMd`       |
