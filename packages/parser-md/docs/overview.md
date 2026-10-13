# Markdown

The Markdown parser writes `.md` and `.markdown` files. It joins a file's source blocks as plain Markdown, separated by blank lines. When the file sets `meta.frontmatter`, it adds that object as YAML frontmatter above the content, after the file banner if one is set.

## Setup

Kubb registers the parser by default, next to `parserTs` and `parserTsx`. Add it yourself only when you set a custom `parsers` array, since that array replaces the default set. List every parser your plugins need. Files that no parser claims are written as their source text only, without imports, exports, banner, or footer.

## Options worth knowing

The parser takes no options. A plugin sets [`meta.frontmatter`](https://kubb.dev/extensions/kubb-labs/parser-md/options#frontmatter) on a file to add YAML frontmatter, and an empty object writes none.

See [Options](https://kubb.dev/extensions/kubb-labs/parser-md/options) for how a plugin sets frontmatter.

## Example

The config below sets a custom `parsers` array and keeps the Markdown parser in it.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { parserMd } from '@kubb/parser-md'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  parsers: [
    parserTs(),
    parserTsx(),
    parserMd(),
  ],
  plugins: [
    pluginTs(),
  ],
})
```

## See also

- [`parsers` in the Kubb configuration](https://kubb.dev/docs/5.x/reference/configuration#parsers)
- [`@kubb/parser-ts`](https://kubb.dev/extensions/kubb-labs/parser-ts)
