import { defineParser } from '@kubb/core'
import { extractStringsFromNodes, type ast } from '@kubb/ast'

import { print, type PrintInput } from './utils.ts'

/**
 * Metadata accepted by `parserMd`. Set `frontmatter` on a `<File meta={...}>` and
 * the parser prepends those keys as a YAML frontmatter envelope.
 */
export type MdMeta = {
  frontmatter?: Record<string, unknown> | null
}

/**
 * Kubb parser for `.md` and `.markdown` files. Joins source blocks as plain
 * markdown (separated by blank lines) and, when `file.meta.frontmatter` is set,
 * prepends a YAML frontmatter envelope produced by `parserMd.print`.
 *
 * Runs by default next to `parserTs` and `parserTsx`. Add it to a custom
 * `parsers` array yourself, since a custom list replaces the default set.
 * `parserTs` keeps handling `.ts`/`.js` files, `parserMd` claims
 * `.md`/`.markdown`.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { adapterOas } from '@kubb/adapter-oas'
 * import { parserMd } from '@kubb/parser-md'
 * import { parserTs, parserTsx } from '@kubb/parser-ts'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   adapter: adapterOas(),
 *   parsers: [parserTs, parserTsx, parserMd],
 *   plugins: [],
 * })
 * ```
 */
export const parserMd = defineParser({
  name: 'markdown',
  extNames: ['.md', '.markdown'],
  print(...parts: Array<PrintInput>) {
    return print(...parts)
  },
  parse(file) {
    const sourceParts: Array<string> = []
    for (const source of file.sources) {
      const text = extractStringsFromNodes(source.nodes as Array<ast.CodeNode>)
      if (text) sourceParts.push(text.trimEnd())
    }
    const body = sourceParts.join('\n\n')

    const meta = file.meta as MdMeta | undefined
    const frontmatter = print(meta?.frontmatter ?? undefined)

    const parts = [file.banner, frontmatter, body, file.footer].filter((segment): segment is string => Boolean(segment)).map((segment) => segment.trimEnd())

    return parts.join('\n\n')
  },
})
