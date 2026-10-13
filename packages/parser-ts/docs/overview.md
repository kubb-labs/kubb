# TypeScript parser

The TypeScript parser prints Kubb's AST as TypeScript source. It resolves imports, writes exports and JSDoc, and handles `.ts` and `.js` files.

The package also exports `parserTsx`, which handles `.tsx` and `.jsx` files with the same options. Kubb registers `parserTs`, `parserTsx`, and `parserMd` by default.

## Setup

Set `defineConfig.parsers` only to change an option. A custom `parsers` array replaces the default set, so list every parser your plugins need. Files no parser claims are written as their source text.

## Options

`extension` rewrites the extension of relative imports and exports. Each key is the extension of a generated file and its value the extension written on that file's relative specifiers, and `''` drops it. By default relative imports have no extension. Use `{ '.ts': '.js' }` for ESM output compiled to JavaScript, or `{ '.ts': '.ts' }` to run the `.ts` files directly in Node.js or compile them with `rewriteRelativeImportExtensions`. Package imports stay unchanged. See [Options](https://kubb.dev/extensions/kubb-labs/parser-ts/options) for its type and default.

## Example

Override import extensions while keeping every default parser registered.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { parserMd } from '@kubb/parser-md'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  parsers: [parserTs({ extension: { '.ts': '.js' } }), parserTsx(), parserMd()],
  plugins: [pluginTs()],
})
```
