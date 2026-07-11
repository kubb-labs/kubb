/**
 * File-member merging. `combineImports` and `combineExports` deduplicate and sort the import and
 * export entries of one file, while `combineSources` deduplicates source entries in original order.
 * `combineImports` also drops imports nothing references. This works on a file's members, not on
 * schema content.
 */
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
 * Deduplicates `SourceNode` objects by `name + isExportable + isTypeOnly`, keeping the first of each
 * key. Unnamed sources fall back to their extracted node strings as the name part of the key. Returns
 * the deduplicated array in original order.
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
 * Used by `mergeMembers` for the same-path name-merge case.
 */
function mergeNameArrays<TName>(existing: Array<TName>, incoming: Array<TName>): Array<TName> {
  const merged = new Set(existing)
  for (const name of incoming) merged.add(name)
  return [...merged]
}

type MergeMembersOptions<TNode, TName> = {
  /**
   * Drops a member before any merging.
   */
  skip?: (node: TNode) => boolean
  /**
   * Deduplicates and filters an array name before merging. An empty result drops the member.
   */
  normalizeNames: (names: Array<TName>) => Array<TName>
  /**
   * Builds the member stored for a new `path:isTypeOnly` group, carrying the normalized names.
   */
  create: (node: TNode, names: Array<TName>) => TNode
  /**
   * Drops a member whose name is not an array. Receives the non-array name.
   */
  skipSingle?: (node: TNode, name: string | null | undefined) => boolean
  /**
   * Exact-identity key deduplicating members whose name is not an array.
   */
  identityKey: (node: TNode, name: string | null | undefined) => string
}

/**
 * Shared merge loop behind `combineExports` and `combineImports`: sorts by `sortKey`, merges
 * array-named members with the same `path:isTypeOnly` key into one member, and deduplicates the
 * rest by `identityKey`.
 */
function mergeMembers<TNode extends { path: string; isTypeOnly?: boolean | null; name?: string | Array<TName> | null }, TName>(
  nodes: Array<TNode>,
  { skip, normalizeNames, create, skipSingle, identityKey }: MergeMembersOptions<TNode, TName>,
): Array<TNode> {
  const result: Array<TNode> = []
  // Accumulates array-named members keyed by `path:isTypeOnly` for name-merging
  const namedByPath = new Map<string, TNode>()
  // Deduplicates non-array members by their exact identity
  const seen = new Set<string>()

  // Precompute sort keys once, avoids recomputing per comparison.
  const keyed = nodes.map((node) => ({ node, key: sortKey(node) }))
  keyed.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))

  for (const { node: curr } of keyed) {
    if (skip?.(curr)) continue

    const { name, path, isTypeOnly } = curr

    if (Array.isArray(name)) {
      const names = normalizeNames(name)
      if (!names.length) continue

      const key = pathTypeKey(path, isTypeOnly)
      const existing = namedByPath.get(key)

      if (existing && Array.isArray(existing.name)) {
        existing.name = mergeNameArrays(existing.name, names)
      } else {
        const newItem = create(curr, names)
        result.push(newItem)
        namedByPath.set(key, newItem)
      }
    } else {
      if (skipSingle?.(curr, name)) continue

      const key = identityKey(curr, name)
      if (!seen.has(key)) {
        result.push(curr)
        seen.add(key)
      }
    }
  }

  return result
}

/**
 * Deduplicates and merges `ExportNode` objects by path and type.
 *
 * Named exports with the same path and `isTypeOnly` flag have their names merged into a single export.
 * Non-array exports are deduplicated by exact identity. Returns a sorted, deduplicated array.
 */
export function combineExports(exports: Array<ExportNode>): Array<ExportNode> {
  return mergeMembers<ExportNode, string>(exports, {
    normalizeNames: (names) => [...new Set(names)],
    create: (node, names) => ({ ...node, name: names }),
    identityKey: (node, name) => exportKey(node.path, name, node.isTypeOnly, node.asAlias),
  })
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

  return mergeMembers<ImportNode, string | { propertyName: string; name?: string }>(imports, {
    skip: (node) => node.path === node.root,
    normalizeNames: (names) =>
      [...new Set(names.map(canonicalizeName))].filter((item) => (typeof item === 'string' ? isUsed(item) : isUsed(item.name ?? item.propertyName))),
    create: (node, names) => ({ ...node, name: names }),
    skipSingle: (node, name) => !!name && !isUsed(name) && !pathsWithUsedNamedImport.has(node.path),
    identityKey: (node, name) => importKey(node.path, name, node.isTypeOnly),
  })
}
