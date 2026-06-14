import { hash } from 'node:crypto'
import path from 'node:path'
import { trimExtName } from '@internals/utils'
import type { FileNode, Node } from './nodes/index.ts'
import { extractStringsFromNodes } from './utils/extractStringsFromNodes.ts'
import { combineExports, combineImports, combineSources } from './utils/fileMerge.ts'

// Node constructors, grouped under the `factory` namespace the way the TypeScript compiler exposes
// `ts.factory.createX`. Aggregating them here lets `export * as factory from './factory.ts'` in the
// barrel surface every `createX` alongside the `createFile`/`update` helpers from a single module.
export { createArrowFunction, createBreak, createConst, createFunction, createJsx, createText, createType } from './nodes/code.ts'
export { createContent } from './nodes/content.ts'
export { createExport, createImport, createSource } from './nodes/file.ts'
export { createFunctionParameter, createFunctionParameters, createIndexedAccessType, createObjectBindingPattern, createTypeLiteral } from './nodes/function.ts'
export { createInput } from './nodes/input.ts'
export { createOperation } from './nodes/operation.ts'
export { createOutput } from './nodes/output.ts'
export { createParameter } from './nodes/parameter.ts'
export { createProperty } from './nodes/property.ts'
export { createRequestBody } from './nodes/requestBody.ts'
export { createResponse } from './nodes/response.ts'
export { createSchema } from './nodes/schema.ts'
export { createDiscriminantNode, createOperationParams } from './utils/ast.ts'

/**
 * Identity-preserving node update: returns `node` unchanged when every field in
 * `changes` already equals (by reference) the current value, otherwise a new node
 * with the changes applied.
 *
 * Mirrors the TypeScript compiler's `factory.updateX` contract, pair it with the
 * structural sharing in {@link transform} so a no-op rewrite doesn't allocate and
 * downstream passes can detect "nothing changed" by identity. Comparison is
 * shallow: a structurally-equal but newly-allocated array/object counts as a change.
 *
 * @example
 * ```ts
 * update(node, { name: node.name })        // -> same `node` reference
 * update(node, { name: 'renamed' })        // -> new node, `name` replaced
 * ```
 */
export function update<T extends Node>(node: T, changes: Partial<T>): T {
  for (const key in changes) {
    if (changes[key] !== node[key as keyof T]) {
      return { ...node, ...changes }
    }
  }

  return node
}

/**
 * Input descriptor for {@link createFile}, before `id`, `name`, and `extname` are computed
 * and `imports`/`exports`/`sources` are deduplicated.
 */
export type UserFileNode<TMeta extends object = object> = Omit<FileNode<TMeta>, 'kind' | 'id' | 'name' | 'extname' | 'imports' | 'exports' | 'sources'> &
  Pick<Partial<FileNode<TMeta>>, 'imports' | 'exports' | 'sources'>

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
 */
export function createFile<TMeta extends object = object>(input: UserFileNode<TMeta>): FileNode<TMeta> {
  const rawExtname = path.extname(input.baseName)
  // Handle dotfile basename like '.ts' where path.extname returns ''
  const extname = (rawExtname || (input.baseName.startsWith('.') ? input.baseName : '')) as `.${string}`
  if (!extname) {
    throw new Error(`No extname found for ${input.baseName}`)
  }

  const source = (input.sources ?? [])
    .flatMap((item) => item.nodes ?? [])
    .map((node) => extractStringsFromNodes([node]))
    .filter(Boolean)
    .join('\n\n')
  const resolvedExports = input.exports?.length ? combineExports(input.exports) : []
  const combinedImports = input.imports?.length ? combineImports(input.imports, resolvedExports, source || undefined) : []
  const localNames = new Set((input.sources ?? []).map((item) => item.name).filter((name): name is string => Boolean(name)))
  const nameOf = (item: string | { propertyName: string; name?: string }): string => (typeof item === 'string' ? item : (item.name ?? item.propertyName))
  // Drop self-imports. Consolidating output (`mode: 'file'`) can place a symbol's
  // definition and a cross-file import of it in the same file. The first pass catches imports that
  // resolve to this file's own path. The second drops imports of names the file already defines,
  // the case consolidation produces when the import path no longer matches `input.path`. Sources
  // stay intact, so the local definition remains. Bare specifiers like `'zod'` never match a path.
  const resolvedImports = combinedImports
    .filter((imp) => imp.path !== input.path)
    .flatMap((imp) => {
      if (!Array.isArray(imp.name)) {
        return typeof imp.name === 'string' && localNames.has(imp.name) ? [] : [imp]
      }
      const kept = imp.name.filter((item) => !localNames.has(nameOf(item)))
      if (!kept.length) return []
      return [kept.length === imp.name.length ? imp : { ...imp, name: kept }]
    })
  const resolvedSources = input.sources?.length ? combineSources(input.sources) : []

  return {
    kind: 'File',
    ...input,
    id: hash('sha256', input.path, 'hex'),
    name: trimExtName(input.baseName),
    extname,
    imports: resolvedImports,
    exports: resolvedExports,
    sources: resolvedSources,
    meta: input.meta ?? ({} as TMeta),
  }
}
