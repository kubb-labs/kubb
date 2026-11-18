# TypeScript

The TypeScript parser prints the `.ts` and `.js` files that plugins generate, with imports, exports, declarations, and JSDoc.

- It rewrites relative import paths.
- The package also exports `parserTsx` for `.tsx` and `.jsx` files, with the same options.

## Setup

No setup is needed. `defineConfig` and the bundler integrations register `parserTs()`, `parserTsx()`, and `parserMd()` by default. Set `parsers` only to change an option or to add a parser.

> [!WARNING]
> A custom `parsers` array replaces the default set, so list every parser your plugins need. A file that no parser claims is written as its source text only, without imports, exports, banner, or footer.

## Options worth knowing

| Option                                                                           | Default         | What it does                                                                                                                                                   |
| -------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`extension`](https://kubb.dev/extensions/kubb-labs/parser-ts/options#extension) | `{ '.ts': '' }` | Sets the extension that relative imports and exports get. Use `{ '.ts': '.js' }` for ESM output and `{ '.ts': '.ts' }` to run `.ts` files directly in Node.js. |

`parserTsx` reads its own `extension` map, so set the `.tsx` key on it too.

## Example

This config adds `.js` to relative imports in `.ts` and `.tsx` files and keeps every default parser.

::code-group

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
  plugins: [pluginTs()],
})
```

```typescript [src/gen/types/Pet.ts]
import type { Category } from './Category.js'

export type Pet = {
  category?: Category
  name: string
}
```

::
