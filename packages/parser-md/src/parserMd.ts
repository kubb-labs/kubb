import { ast } from '@kubb/ast'
import { defineExtension } from '@kubb/core'
import { stringify } from 'yaml'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'

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
 * prepends a YAML frontmatter envelope.
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
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   adapter: adapterOas(),
 *   parsers: [parserTs(), parserTsx(), parserMd()],
 *   plugins: [],
 * })
 * ```
 */
export const parserMd = defineExtension({
  kind: 'parser',
  meta: { name: 'markdown', version, compatibility, issues: 'https://github.com/kubb-labs/kubb/issues' },
  build() {
    return {
      extNames: ['.md', '.markdown'],
      print: (...parts: Array<string>) => parts.filter(Boolean).join('\n\n'),
      parse(file) {
        const body = file.sources
          .map((source) => ast.extractStringsFromNodes(source.nodes))
          .filter(Boolean)
          .map((text) => text.trimEnd())
          .join('\n\n')

        const frontmatter = (file.meta as MdMeta | undefined)?.frontmatter
        const envelope = frontmatter && Object.keys(frontmatter).length ? `---\n${stringify(frontmatter).trimEnd()}\n---` : ''

        return [file.banner, envelope, body, file.footer]
          .filter((segment): segment is string => Boolean(segment))
          .map((segment) => segment.trimEnd())
          .join('\n\n')
      },
    }
  },
})
