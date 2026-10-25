import { defineExtension } from '@kubb/core'
import { inlineTsx } from './inline.ts'
import { parserTs, type ParserTsOptions } from './parserTs.ts'
import type { TsNode } from './utils.ts'

/**
 * Kubb parser for `.tsx` and `.jsx` files. Delegates to `parserTs`, since JSX
 * prints as text the same way, so it shares the same `extension` option.
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
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   adapter: adapterOas(),
 *   parsers: [parserTsx()],
 *   plugins: [],
 * })
 * ```
 */
export const parserTsx = defineExtension<ParserTsOptions, object, string | TsNode>({
  kind: 'parser',
  meta: { name: 'tsx', issues: 'https://github.com/kubb-labs/kubb/issues' },
  build: (options) => ({ ...parserTs(options), extNames: ['.tsx', '.jsx'], inline: inlineTsx }),
})
