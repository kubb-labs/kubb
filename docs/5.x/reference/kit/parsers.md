---
layout: doc
title: Parsers - Print generated files as source code
description: Define a Kubb parser with defineExtension and kind parser. It turns the AST of a generated file into the source written to disk.
outline:
  - 2
  - 3
order: 6
navigation:
  title: Parsers
  icon: i-iconoir-code
---

# Parsers

A parser turns a `FileNode` into the source text Kubb writes. Define one with [`defineExtension`](/docs/5.x/reference/kit/extensions#define-extension) and `kind: 'parser'`. `build` gets the user's options and returns the parser methods. [`meta`](/docs/5.x/reference/kit/extensions#meta) and the [factory statics](/docs/5.x/reference/kit/extensions#factory-statics) work as for every extension.

> [!TIP]
> For TypeScript and JavaScript output, use [`@kubb/parser-ts`](/extensions/kubb-labs/parser-ts). When the config sets no `parsers`, `defineConfig` adds `parserTs()`, `parserTsx()`, and `parserMd()`. Write your own only for another language, such as Python, Kotlin, or Rust.

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

> [!WARNING]
> A non-empty `parsers` array replaces the defaults. An empty one keeps them. To keep TypeScript and Markdown output, list the defaults again.

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
| `inline`   | `InlineLanguage`                                   | No       | Before barrels, for inline sources  | Lets files of this parser absorb inline sources. `parserTs` has it. See [Inline sources](/docs/5.x/reference/jsx#inline-sources). |
| `copy`     | `(file: FileNode, source: string) => UserFileNode` | No       | For each `copy` file                | Describes a copied template as nodes, such as its imports as `ImportNode`s, for `parse` to print. Without it, Kubb copies the file as is. |

[Parser selection](#parser-selection) and [Parser fallback](#parser-fallback) cover duplicate extensions and files no parser handles.

## Parser naming {#parser-naming}

| Surface        | Pattern                                          | Example                      |
| -------------- | ------------------------------------------------ | ---------------------------- |
| npm package    | `@<scope>/parser-<name>` or `kubb-parser-<name>` | `@kubb/parser-ts`            |
| `meta.name`    | The output language or format, in lowercase      | `'typescript'`, `'markdown'` |
| Factory export | `parser<Name>`                                   | `parserTs`, `parserMd`       |

## Less common cases {#less-common-cases}

### Parser selection {#parser-selection}

When two parsers in [`parsers`](/docs/5.x/reference/configuration#parsers) register the same file extension, the last one in the array wins.

> [!IMPORTANT]
> Put the parser you want for that extension last.

### Parser fallback {#parser-fallback}

When no parser handles a file's extension, Kubb joins its sources as they are. To control the output, add a parser for that extension.
