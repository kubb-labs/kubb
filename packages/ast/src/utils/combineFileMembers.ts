/**
 * File-member merging. `combineImports` and `combineExports` deduplicate and sort the import and
 * export entries of one file, while `combineSources` deduplicates source entries in original order.
 * `combineImports` also drops imports nothing references. This works on a file's members, not on
 * schema content.
 */
import type { ExportNode, ImportNode, SourceNode } from '../nodes/index.ts'
import { extractStringsFromNodes } from './extractStringsFromNodes.ts'

const IDENTIFIER_RUN = /[\w$]+/g

/**
 * How many imports a file needs before indexing the source beats scanning it once per name.
 */
const INDEX_ABOVE_IMPORTS = 128

type ImportNameItem = string | { propertyName: string; name?: string }

type FileMember = { name?: string | Array<unknown> | null; isTypeOnly?: boolean | null; path: string }

/**
 * Returns the local binding an import name item introduces: the alias when there is one, else the
 * imported name.
 */
export function importLocalName(item: ImportNameItem): string {
  return typeof item === 'string' ? item : (item.name ?? item.propertyName)
}

/**
 * Computes a multi-level sort key for exports and imports:
 * non-array names first (wildcards/namespace aliases). Type-only before value. Alphabetical path. Unnamed before named.
 */
function sortKey(node: FileMember): string {
  const isArray = Array.isArray(node.name) ? '1' : '0'
  const typeOnly = node.isTypeOnly ? '0' : '1'
  const hasName = node.name != null ? '1' : '0'
  const name = Array.isArray(node.name) ? node.name.toSorted().join('\0') : (node.name ?? '')
  return `${isArray}:${typeOnly}:${node.path}:${hasName}:${name}`
}

/**
 * Sorts members by {@link sortKey}. Keys are computed once per node, not per comparison.
 */
function sortMembers<TNode extends FileMember>(nodes: Array<TNode>): Array<TNode> {
  return nodes
    .map((node) => ({ node, key: sortKey(node) }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .map(({ node }) => node)
}

/**
 * Returns a collector for array-named members. A member whose path and `isTypeOnly` were already
 * seen folds its names into that entry, otherwise it joins `result` as a new entry.
 */
function mergeByPath<TNode extends FileMember>(result: Array<TNode>): (member: { node: TNode; names: Array<unknown> }) => void {
  const byPath = new Map<string, TNode>()

  return ({ node, names }) => {
    const key = `${node.path}:${node.isTypeOnly ?? false}`
    const existing = byPath.get(key)

    if (existing && Array.isArray(existing.name)) {
      existing.name = [...new Set([...existing.name, ...names])]
      return
    }

    const item = { ...node, name: names }
    result.push(item)
    byPath.set(key, item)
  }
}

/**
 * Deduplicates `SourceNode` objects by `name + isExportable + isTypeOnly`, keeping the first of each
 * key. Unnamed sources fall back to their extracted node strings as the name part of the key. Returns
 * the deduplicated array in original order.
 */
export function combineSources(sources: Array<SourceNode>): Array<SourceNode> {
  const seen = new Map<string, SourceNode>()
  for (const source of sources) {
    const nameKey = source.name ?? extractStringsFromNodes(source.nodes)
    const key = `${nameKey}:${source.isExportable ?? false}:${source.isTypeOnly ?? false}`
    if (!seen.has(key)) seen.set(key, source)
  }
  return [...seen.values()]
}

/**
 * Deduplicates and merges `ExportNode` objects by path and type.
 *
 * Named exports with the same path and `isTypeOnly` flag have their names merged into a single export.
 * Non-array exports are deduplicated by exact identity. Returns a sorted, deduplicated array.
 */
export function combineExports(exports: Array<ExportNode>): Array<ExportNode> {
  const result: Array<ExportNode> = []
  const merge = mergeByPath(result)
  // Deduplicates non-array exports by their exact identity
  const seen = new Set<string>()

  for (const curr of sortMembers(exports)) {
    const { name, path, isTypeOnly, asAlias } = curr

    if (Array.isArray(name)) {
      if (name.length) merge({ node: curr, names: [...new Set(name)] })
      continue
    }

    const key = `${path}:${name ?? ''}:${isTypeOnly ?? false}:${asAlias ?? ''}`
    if (!seen.has(key)) {
      result.push(curr)
      seen.add(key)
    }
  }

  return result
}

/**
 * Deduplicates and merges `ImportNode` objects, filtering out unused imports.
 *
 * Retains imports that are referenced in `source` or re-exported. Imports with the same path and
 * `isTypeOnly` flag have their names merged. Returns a sorted, deduplicated, filtered array.
 */
export function combineImports(imports: Array<ImportNode>, exports: Array<ExportNode>, source?: string): Array<ImportNode> {
  // Build a lookup of all exported names to retain imports that are re-exported
  const exportedNames = new Set(exports.flatMap((e) => (Array.isArray(e.name) ? e.name : e.name ? [e.name] : [])))
  // `createFile` re-runs on every merge into a file, so scanning the source once per import name
  // costs a heavily merged file that scan again for every fragment it already holds. Indexing pays
  // for itself there, and costs more than it saves on the small files the default output produces.
  const identifiers = source && imports.length > INDEX_ABOVE_IMPORTS ? new Set(source.match(IDENTIFIER_RUN)) : null

  // A name in the index is used. One that is not still might be, inside a longer identifier, so the
  // substring test stays behind it.
  const isUsed = (importName: string): boolean => !source || identifiers?.has(importName) || source.includes(importName) || exportedNames.has(importName)

  // Memoize object import names so the same logical (propertyName, name) pair always
  // reuses the same object reference. Set-based deduplication then works correctly.
  const importNameMemo = new Map<string, ImportNameItem>()
  const canonicalizeName = (n: ImportNameItem): ImportNameItem => {
    if (typeof n === 'string') return n
    const key = `${n.propertyName}:${n.name ?? ''}`
    if (!importNameMemo.has(key)) importNameMemo.set(key, n)
    return importNameMemo.get(key)!
  }

  // Paths that keep at least one used named import. A default import from such a path is retained
  // even when its binding can't be found in `source` e.g. a generated `client` default import
  // alongside `import type { Client } from <same path>`, where merged grouped output omits the body.
  const pathsWithUsedNamedImport = new Set<string>()
  for (const node of imports) {
    if (Array.isArray(node.name) && node.name.some((item) => isUsed(importLocalName(item)))) {
      pathsWithUsedNamedImport.add(node.path)
    }
  }

  const result: Array<ImportNode> = []
  const merge = mergeByPath(result)
  // Deduplicates non-array imports by their exact identity
  const seen = new Set<string>()

  for (const curr of sortMembers(imports)) {
    if (curr.path === curr.root) continue

    const { name, path, isTypeOnly } = curr

    if (Array.isArray(name)) {
      const names = [...new Set(name.map(canonicalizeName))].filter((item) => isUsed(importLocalName(item)))
      if (names.length) merge({ node: curr, names })
      continue
    }

    if (!isUsed(name) && !pathsWithUsedNamedImport.has(path)) continue

    const key = `${path}:${name}:${isTypeOnly ?? false}`
    if (!seen.has(key)) {
      result.push(curr)
      seen.add(key)
    }
  }

  return result
}
