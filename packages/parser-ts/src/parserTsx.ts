import type { Parser } from '@kubb/core'
import { defineParser } from '@kubb/core'
import { parserTs } from './parserTs.ts'

/**
 * Parser that converts `.tsx` and `.jsx` files to strings.
 * Delegates to `typescriptParser` since the TypeScript compiler natively
 * supports JSX/TSX syntax via `ScriptKind.TSX`.
 *
 * Add this parser to the `parsers` option in `defineConfig` when generating `.tsx`/`.jsx` files.
 *
 * @default extname '.tsx'
 */
export const parserTsx: Parser = defineParser({
  name: 'tsx',
  extNames: ['.tsx', '.jsx'],
  async parse(file, options = { extname: '.tsx' }) {
    return parserTs.parse(file, options)
  },
})
