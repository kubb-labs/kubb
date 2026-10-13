# Markdown parser

The Markdown parser writes `.md` and `.markdown` files. It joins a file's source blocks as plain Markdown, separated by blank lines. When the file sets `meta.frontmatter`, it adds that object as YAML frontmatter at the top.

It takes no options. Kubb registers it by default with the TypeScript parsers.

## Setup

Add it yourself only when you set a custom `parsers` array, since that array replaces the default set. List every parser your plugins need.

```ts
import { defineConfig } from 'kubb/config'
import { parserMd } from '@kubb/parser-md'
import { parserTs, parserTsx } from '@kubb/parser-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  parsers: [parserTs(), parserTsx(), parserMd()],
  plugins: [],
})
```
