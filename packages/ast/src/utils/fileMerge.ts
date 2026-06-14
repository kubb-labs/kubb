import type { ExportNode, ImportNode, SourceNode } from '../nodes/index.ts'
import { extractStringsFromNodes } from './extractStringsFromNodes.ts'

function sourceKey(source: SourceNode): string {
  const nameKey = source.name ?? extractStringsFromNodes(source.nodes)
  return `${nameKey}:${source.isExportable ?? false}:${source.isTypeOnly ?? false}`
}

function pathTypeKey(path: string, isTypeOnly: boolean | null | undefined): string {
  return `${path}:${isTypeOnly ?? false}`
}

function exportKey(path: string, name: string | null | undefined, isTypeOnly: boolean | null | undefined, asAlias: boolean | null | undefined): string {
  return `${path}:${name ?? ''}:${isTypeOnly ?? false}:${asAlias ?? ''}`
}

function importKey(path: string, name: string | null | undefined, isTypeOnly: boolean | null | undefined): string {
  return `${path}:${name ?? ''}:${isTypeOnly ?? false}`
}

/**
 * Computes a multi-level sort key for exports and imports:
 * non-array names first (wildcards/namespace aliases). Type-only before value. Alphabetical path. Unnamed before named.
 */
function sortKey(node: { name?: string | Array<unknown> | null; isTypeOnly?: boolean | null; path: string }): string {
  const isArray = Array.isArray(node.name) ? '1' : '0'
  const typeOnly = node.isTypeOnly ? '0' : '1'
  const hasName = node.name != null ? '1' : '0'
  const name = Array.isArray(node.name) ? node.name.toSorted().join('\0') : (node.name ?? '')
  return `${isArray}:${typeOnly}:${node.path}:${hasName}:${name}`
}

/**
 * Deduplicates and merges `SourceNode` objects by `name + isExportable + isTypeOnly`.
 *
 * Unnamed sources are deduplicated by object reference. Returns a deduplicated array in original order.
 */
export function combineSources(sources: Array<SourceNode>): Array<SourceNode> {
  const seen = new Map<string, SourceNode>()
  for (const source of sources) {
    const key = sourceKey(source)
    if (!seen.has(key)) seen.set(key, source)
  }
  return [...seen.values()]
}

/**
 * Merges `incoming` names into `existing`, preserving order and dropping duplicates.
 *
 * Shared by `combineExports` and `combineImports` for the same-path name-merge case.
 */
function mergeNameArrays<TName>(existing: Array<TName>, incoming: Array<TName>): Array<TName> {
  const merged = new Set(existing)
  for (const name of incoming) merged.add(name)
  return [...merged]
}

/**
 * Deduplicates and merges `ExportNode` objects by path and type.
 *
 * Named exports with the same path and `isTypeOnly` flag have their names merged into a single export.
 * Non-array exports are deduplicated by exact identity. Returns a sorted, deduplicated array.
 */
export function combineExports(exports: Array<ExportNode>): Array<ExportNode> {
  const result: Array<ExportNode> = []
  // Accumulates array-named exports keyed by `path:isTypeOnly` for name-merging
  const namedByPath = new Map<string, ExportNode>()
  // Deduplicates non-array exports by their exact identity
  const seen = new Set<string>()

  // Precompute sort keys once, avoids recomputing per comparison.
  const keyed = exports.map((node) => ({ node, key: sortKey(node) }))
  keyed.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))

  for (const { node: curr } of keyed) {
    const { name, path, isTypeOnly, asAlias } = curr

    if (Array.isArray(name)) {
      if (!name.length) continue

      const key = pathTypeKey(path, isTypeOnly)
      const existing = namedByPath.get(key)

      if (existing && Array.isArray(existing.name)) {
        existing.name = mergeNameArrays(existing.name, name)
      } else {
        const newItem: ExportNode = { ...curr, name: [...new Set(name)] }
        result.push(newItem)
        namedByPath.set(key, newItem)
      }
    } else {
      const key = exportKey(path, name, isTypeOnly, asAlias)
      if (!seen.has(key)) {
        result.push(curr)
        seen.add(key)
      }
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
  const isUsed = (importName: string): boolean => !source || source.includes(importName) || exportedNames.has(importName)

  // Memoize object import names so the same logical (propertyName, name) pair always
  // reuses the same object reference. Set-based deduplication then works correctly.
  const importNameMemo = new Map<string, { propertyName: string; name?: string }>()
  const canonicalizeName = (n: string | { propertyName: string; name?: string }): string | { propertyName: string; name?: string } => {
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
    if (!Array.isArray(node.name)) continue
    if (node.name.some((item) => (typeof item === 'string' ? isUsed(item) : isUsed(item.name ?? item.propertyName)))) {
      pathsWithUsedNamedImport.add(node.path)
    }
  }

  const result: Array<ImportNode> = []
  // Accumulates array-named imports keyed by `path:isTypeOnly` for name-merging
  const namedByPath = new Map<string, ImportNode>()
  // Deduplicates non-array imports by their exact identity
  const seen = new Set<string>()

  // Precompute sort keys once, avoids recomputing per comparison.
  const keyed = imports.map((node) => ({ node, key: sortKey(node) }))
  keyed.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))

  for (const { node: curr } of keyed) {
    if (curr.path === curr.root) continue

    const { path, isTypeOnly } = curr
    let { name } = curr

    if (Array.isArray(name)) {
      name = [...new Set(name.map(canonicalizeName))].filter((item) => (typeof item === 'string' ? isUsed(item) : isUsed(item.name ?? item.propertyName)))
      if (!name.length) continue

      const key = pathTypeKey(path, isTypeOnly)
      const existing = namedByPath.get(key)

      if (existing && Array.isArray(existing.name)) {
        existing.name = mergeNameArrays(existing.name, name)
      } else {
        const newItem: ImportNode = { ...curr, name }
        result.push(newItem)
        namedByPath.set(key, newItem)
      }
    } else {
      if (name && !isUsed(name) && !pathsWithUsedNamedImport.has(path)) continue

      const key = importKey(path, name, isTypeOnly)
      if (!seen.has(key)) {
        result.push(curr)
        seen.add(key)
      }
    }
  }

  return result
}
