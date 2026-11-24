import { hash } from 'node:crypto'
import path from 'node:path'
import { nodeKinds } from '../constants.ts'
import { combineExports, combineImports, combineSources } from '../utils/combineFileMembers.ts'
import { getNames } from '../utils/moduleNames.ts'
import { getNodeText } from '../utils/nodeText.ts'
import { createImport, type FileNode, type ImportNode, type UserFileNode } from './file.ts'

/**
 * Creates a fully resolved `FileNode` from a file input descriptor.
 *
 * Computes:
 * - `id` SHA256 hash of the file path
 * - `name` `baseName` without extension
 * - `extname` extension extracted from `baseName`
 *
 * Deduplicates:
 * - `sources` via `combineSources`
 * - `exports` via `combineExports`
 * - `imports` via `combineImports` (also filters unused imports)
 *
 * @throws {Error} when `baseName` has no extension.
 *
 * @example
 * ```ts
 * const file = createFile({
 *   baseName: 'petStore.ts',
 *   path: 'src/models/petStore.ts',
 *   sources: [createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')] })],
 *   imports: [createImport({ name: ['z'], path: 'zod' })],
 *   exports: [createExport({ name: ['Pet'], path: './petStore' })],
 * })
 * // file.id      = SHA256 hash of 'src/models/petStore.ts'
 * // file.name    = 'petStore'
 * // file.extname = '.ts'
 * ```
 *
 * @example Copy a real file into the output
 * ```ts
 * const file = createFile({
 *   baseName: 'client.ts',
 *   path: 'src/gen/client.ts',
 *   copy: '/abs/path/to/templates/client.ts',
 * })
 * ```
 */
export function createFile<TMeta extends object = object>(input: UserFileNode<TMeta>): FileNode<TMeta> {
  const extname = path.extname(input.baseName) as `.${string}`
  if (!extname) {
    throw new Error(`No extname found for ${input.baseName}`)
  }

  const resolvedExports = input.exports?.length ? combineExports(input.exports) : []
  const resolvedSources = input.sources?.length ? combineSources(input.sources) : []

  // Skip building the source text and local-name set when there are no imports to resolve against them.
  const resolvedImports: Array<ImportNode> = (() => {
    if (!input.imports?.length) return []

    const sourceParts: Array<string> = []
    const localNames = new Set<string>()
    // Only the sources the file keeps count: an import used just by a dropped duplicate is unused.
    for (const item of resolvedSources) {
      const extracted = item.nodes && getNodeText(item.nodes)
      if (extracted) sourceParts.push(extracted)
      if (item.name) localNames.add(item.name)
    }
    const source = sourceParts.join('\n') || undefined
    const combinedImports = combineImports(input.imports, resolvedExports, source)
    // Consolidating output (`mode: 'file'`) can put a symbol's definition and an import of it in the
    // same file: by path when the import still targets this file, by name when consolidation moved it.
    return combinedImports.flatMap((imp) => {
      if (imp.path === input.path) return []
      const names = getNames(imp)
      const kept = names.filter((item) => !localNames.has(item.alias ?? item.name))
      if (!kept.length) return []
      return [kept.length === names.length ? imp : createImport({ path: imp.path, ...(imp.root != null ? { root: imp.root } : {}), names: kept })]
    })
  })()

  return {
    ...input,
    kind: nodeKinds.file,
    id: hash('sha256', input.path, 'hex'),
    name: path.basename(input.baseName, extname),
    extname,
    imports: resolvedImports,
    exports: resolvedExports,
    sources: resolvedSources,
    meta: (input.meta ?? {}) as TMeta,
  }
}
