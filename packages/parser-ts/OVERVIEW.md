# TypeScript parser

The TypeScript parser prints Kubb's AST as source code with the official TypeScript compiler. It resolves imports, writes exports and JSDoc, and handles `.ts` and `.js` files.

The package also exports `parserTsx`, which handles `.tsx` and `.jsx` files with the same options. Kubb registers `parserTs`, `parserTsx`, and `parserMd` by default.

## Setup

Set `defineConfig.parsers` only to change an option. A custom `parsers` array replaces the default set, so list every parser your plugins need. Files no parser claims are written as their source text.

```ts
import { defineConfig } from 'kubb/config'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { parserMd } from '@kubb/parser-md'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  parsers: [parserTs({ extension: { '.ts': '.js' } }), parserTsx(), parserMd()],
  plugins: [],
})
```

## Options

`extension` rewrites the extension of relative imports and exports. Keys are the source extension and values the output, and `''` drops it. By default `.ts` imports have no extension. Use `{ '.ts': '.js' }` for ESM packages, or `{ '.ts': '.ts' }` for Node.js `NodeNext` resolution. Package imports stay unchanged.
