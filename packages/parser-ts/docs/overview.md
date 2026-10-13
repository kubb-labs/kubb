# TypeScript

The TypeScript parser writes `.ts` and `.js` files. It turns each file's AST into source text with imports, exports, declarations, and JSDoc, and resolves relative import paths. Its `print` helper uses the official TypeScript printer, which plugins such as `@kubb/plugin-ts` call to print TypeScript nodes.

The package also exports `parserTsx`, which writes `.tsx` and `.jsx` files with the same options.

## Setup

Kubb registers `parserTs`, `parserTsx`, and `parserMd` by default. Set `defineConfig.parsers` only to change an option or add a parser. A custom `parsers` array replaces the default set, so list every parser your plugins need. Files that no parser claims are written as their source text only, without imports or exports.

## Options worth knowing

- `extension` rewrites the extension of relative imports and exports. Keys are the extension of the generated file, and values the extension its relative imports and exports get. `''` drops it. By default, imports in `.ts` files have no extension. Use `{ '.ts': '.js' }` for ESM packages, or `{ '.ts': '.ts' }` when you run the `.ts` files directly in Node.js or compile with `rewriteRelativeImportExtensions`. Package imports stay unchanged.

`parserTsx` reads its own `extension` map, so set the `.tsx` key on it as well.

See [Options](https://kubb.dev/extensions/kubb-labs/parser-ts/options) for its type and default.

## Example

The config below adds `.js` to relative imports in `.ts` and `.tsx` files and keeps every default parser registered.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { parserMd } from '@kubb/parser-md'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  parsers: [
    parserTs({ extension: { '.ts': '.js' } }),
    parserTsx({ extension: { '.tsx': '.js' } }),
    parserMd(),
  ],
  plugins: [
    pluginTs(),
  ],
})
```
