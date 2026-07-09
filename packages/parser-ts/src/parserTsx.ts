import { defineParser } from '@kubb/core'
import type * as ts from 'typescript'
import { parserTs, type ParserTsOptions } from './parserTs.ts'
import { print } from './utils.ts'

/**
 * Kubb parser for `.tsx` and `.jsx` files. Delegates to `parserTs` because the
 * TypeScript compiler handles JSX natively via `ScriptKind.TSX`, so it shares the
 * same `extension` option.
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
 *   parsers: [parserTsx()],
 *   plugins: [],
 * })
 * ```
 */
export const parserTsx = defineParser((options: ParserTsOptions = {}) => {
  const parser = parserTs(options)

  return {
    name: 'tsx',
    extNames: ['.tsx', '.jsx'],
    print(...nodes: Array<ts.Node>) {
      return print(...nodes)
    },
    parse(file) {
      return parser.parse(file)
    },
  }
})
