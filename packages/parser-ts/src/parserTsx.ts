import { defineParser } from '@kubb/core'
import type * as ts from 'typescript'
import { parserTs } from './parserTs.ts'
import { print } from './utils.ts'

/**
 * Kubb parser for `.tsx` and `.jsx` files. Delegates to `parserTs` because the
 * TypeScript compiler handles JSX natively via `ScriptKind.TSX`.
 *
 * Add to the `parsers` array on `defineConfig` when generating components for
 * React (or any framework that emits JSX).
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { adapterOas } from '@kubb/adapter-oas'
 * import { parserTsx } from '@kubb/parser-ts'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   adapter: adapterOas(),
 *   parsers: [parserTsx],
 *   plugins: [],
 * })
 * ```
 */
export const parserTsx = defineParser({
  name: 'tsx',
  extNames: ['.tsx', '.jsx'],
  print(...nodes: Array<ts.Node>) {
    return print(...nodes)
  },
  parse(file, options = { extname: '.tsx' }) {
    return parserTs.parse(file, options)
  },
})
