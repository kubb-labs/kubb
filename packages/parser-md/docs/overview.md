# Markdown

The Markdown parser joins a file's source blocks as plain Markdown, separated by blank lines. When a file sets `meta.frontmatter`, the parser writes that object as YAML frontmatter above the content, after the file banner if one is set.

## Setup

With `defineConfig` from `kubb/config`, Kubb registers the parser by default, next to `parserTs` and `parserTsx`, so no setup is needed. Bundler integrations leave it out. Add it yourself only when you set a custom `parsers` array, because that array replaces the default set. List every parser your plugins need. Files that no parser claims are written as their source text only, without imports, exports, banner, or footer.

## Options worth knowing

The parser takes no options. Plugins control the output through `meta.frontmatter` on each file, and an empty object writes none.

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
