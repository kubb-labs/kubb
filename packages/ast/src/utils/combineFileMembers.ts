/**
 * File-member merging. `combineImports` and `combineExports` deduplicate and sort the import and
 * export entries of one file, while `combineSources` deduplicates source entries in original order.
 * `combineImports` also drops imports nothing references. This works on a file's members, not on
 * schema content.
 */
import path from 'node:path'
import { memo } from '@internals/utils'
import type { ExportNode, ImportNode, ModuleName, SourceNode } from '../nodes/file.ts'
import { exportFields, getNames, getSpace, importFields } from './moduleNames.ts'

const IDENTIFIER_RUN = /[\w$]+/g

/**
 * How many imports a file needs before indexing the source beats scanning it once per name.
 */
const INDEX_ABOVE_IMPORTS = 128

type ImportNameItem = string | { propertyName: string; name?: string }

type FileMember = { name?: string | Array<unknown> | null; isTypeOnly?: boolean | null; path: string; root?: string | null }

/**
 * Returns the local binding an import name item introduces: the alias when there is one, else the
 * imported name.
 */
export function importLocalName(item: ImportNameItem): string {
  return typeof item === 'string' ? item : (item.name ?? item.propertyName)
}

const hasSpace = (item: ModuleName): boolean => !!item.space

// Splits an import built from `names` into the deprecated-field imports that print the same statements, or
// returns `undefined` while a space is open, since only the declaration it points to can tell.
function splitImport(node: ImportNode): Array<ImportNode> | undefined {
  const names = getNames(node)
  if (!names.every(hasSpace)) return undefined

  const base = { kind: node.kind, path: node.path, ...(node.root != null ? { root: node.root } : {}) }
  const split: Array<ImportNode> = []
  const named = new Map<boolean, Array<ImportNameItem>>()
  for (const item of names) {
    const isTypeOnly = item.space === 'type'
    if (item.alias && (item.name === '*' || item.name === 'default')) {
      split.push({ ...base, name: item.alias, isTypeOnly, isNameSpace: item.name === '*' })
      continue
    }
    const list = named.get(isTypeOnly) ?? []
    named.set(isTypeOnly, list)
    list.push(item.alias ? { propertyName: item.name, name: item.alias } : item.name)
  }
  for (const [isTypeOnly, name] of named) split.push({ ...base, name, isTypeOnly })
  return split
}

// Like `splitImport`, and also `undefined` for an alias on a named export, which only `names` can hold.
function splitExport(node: ExportNode): Array<ExportNode> | undefined {
  const names = getNames(node)
  if (!names.every(hasSpace) || names.some((item) => item.alias && item.name !== '*')) return undefined

  const split: Array<ExportNode> = []
  const named = new Map<boolean, Array<string>>()
  for (const item of names) {
    const isTypeOnly = item.space === 'type'
    if (item.name === '*') {
      split.push({ kind: node.kind, path: node.path, isTypeOnly, ...(item.alias ? { name: item.alias, asAlias: true } : {}) })
      continue
    }
    const list = named.get(isTypeOnly) ?? []
    named.set(isTypeOnly, list)
    list.push(item.name)
  }
  for (const [isTypeOnly, name] of named) split.push({ kind: node.kind, path: node.path, name, isTypeOnly })
  return split
}

function partition<TNode>(nodes: Array<TNode>, split: (node: TNode) => Array<TNode> | undefined): { known: Array<TNode>; open: Array<TNode> } {
  const known: Array<TNode> = []
  const open: Array<TNode> = []
  for (const node of nodes) {
    // Nodes built with the deprecated fields need no split, which keeps this path free of allocations.
    if (!(node as { names?: unknown }).names) {
      known.push(node)
      continue
    }
    const parts = split(node)
    if (parts) known.push(...parts)
    else open.push(node)
  }
  return { known, open }
}

// Keeps nodes with an open space once per path and names, until `ast.file.resolveSpaces` settles them.
function keepOpen<TNode extends ImportNode | ExportNode>(nodes: Array<TNode>, keep: (item: ModuleName) => boolean = () => true): Array<TNode> {
  const seen = new Set<string>()
  return nodes.flatMap((node) => {
    const names = getNames(node).filter(keep)
    const key = `${node.path}\0${node.kind === 'Import' ? (node.root ?? '') : ''}\0${JSON.stringify(names)}`
    if (!names.length || seen.has(key)) return []
    seen.add(key)
    const fields = node.kind === 'Import' ? importFields(names) : exportFields(names)
    return [{ ...node, ...fields, names }]
  })
}

/**
 * Relative specifiers by `root`, then `path`. `createFile` sorts a file's imports again on every
 * merge, and the path math dominated that sort on large specs. Two levels keep the existing strings
 * as keys, so lookups reuse their hashes instead of hashing a new joined key each time.
 */
const specifierCache = memo.create<string, Map<string, string>>({ max: 10_000 })

/**
 * Returns the specifier a member is written with: POSIX and relative to the importing file when it
 * has a `root`, like `getRelativePath` in parser-ts. Sorting on it keeps the order the same on every OS.
 */
function specifier(node: FileMember): string {
  const { root, path: target } = node
  if (!root) return target
  const byPath = memo(specifierCache, root, () => new Map<string, string>())
  return memo(byPath, target, () => {
    const relative = path.relative(path.dirname(root), target).replaceAll('\\', '/')
    return relative.startsWith('../') ? relative : `./${relative}`
  })
}

/**
 * Computes a multi-level sort key for exports and imports:
 * non-array names first (wildcards/namespace aliases). Type-only before value. Alphabetical specifier. Unnamed before named.
 */
function sortKey(node: FileMember): string {
  const isArray = Array.isArray(node.name) ? '1' : '0'
  const typeOnly = node.isTypeOnly ? '0' : '1'
  const hasName = node.name != null ? '1' : '0'
  const name = Array.isArray(node.name) ? node.name.toSorted().join('\0') : (node.name ?? '')
  return `${isArray}:${typeOnly}:${specifier(node)}:${hasName}:${name}`
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
  // Append new names instead of rebuilding the list, which went quadratic on a shared path.
  const byPath = new Map<string, { names: Array<unknown>; seen: Set<unknown> }>()

  return ({ node, names }) => {
    const key = `${node.path}:${node.isTypeOnly ?? false}`
    const existing = byPath.get(key)

    if (existing) {
      for (const name of names) {
        if (existing.seen.has(name)) continue
        existing.seen.add(name)
        existing.names.push(name)
      }
      return
    }

    const item = { ...node, name: [...names] }
    result.push(item)
    byPath.set(key, { names: item.name, seen: new Set(names) })
  }
}

/**
 * Deduplicates `SourceNode` objects by `name + export + space`, keeping the first of each
 * key. An unnamed source only drops when the same node appears twice, so markdown can repeat a
 * paragraph or a table. Returns the deduplicated array in original order.
 */
export function combineSources(sources: Array<SourceNode>): Array<SourceNode> {
  const seen = new Set<SourceNode | string>()
  return sources.filter((source) => {
    const key = source.name != null ? `${source.name}:${source.export ?? source.isExportable ?? false}:${getSpace(source)}` : source
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Deduplicates and merges `ExportNode` objects by path and type.
 *
 * Named exports with the same path and `isTypeOnly` flag have their names merged into a single export.
 * Non-array exports are deduplicated by exact identity. Returns a sorted, deduplicated array.
 */
export function combineExports(exports: Array<ExportNode>): Array<ExportNode> {
  const { known, open } = partition(exports, splitExport)
  const result: Array<ExportNode> = []
  const merge = mergeByPath(result)
  // Deduplicates non-array exports by their exact identity
  const seen = new Set<string>()

  for (const curr of sortMembers(known)) {
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

  return [...result, ...keepOpen(open)]
}

/**
 * Deduplicates and merges `ImportNode` objects, filtering out unused imports.
 *
 * Retains imports that are referenced in `source` or re-exported. Imports with the same path and
 * `isTypeOnly` flag have their names merged. Returns a sorted, deduplicated, filtered array.
 */
export function combineImports(imports: Array<ImportNode>, exports: Array<ExportNode>, source?: string): Array<ImportNode> {
  const { known, open } = partition(imports, splitImport)
  // Build a lookup of all exported names to retain imports that are re-exported
  const exportedNames = new Set(exports.flatMap((e) => (Array.isArray(e.name) ? e.name : e.name ? [e.name] : [])))
  // `createFile` re-runs on every merge into a file, so scanning the source once per import name
  // costs a heavily merged file that scan again for every fragment it already holds. Indexing pays
  // for itself there, and costs more than it saves on the small files the default output produces.
  const identifiers = source && known.length > INDEX_ABOVE_IMPORTS ? new Set(source.match(IDENTIFIER_RUN)) : null

  // A name in the index is used. One that is not still might be, inside a longer identifier, so the
  // substring test stays behind it.
  const isUsed = (importName: string): boolean => !source || identifiers?.has(importName) || source.includes(importName) || exportedNames.has(importName)

  // Memoize object import names so the same logical (propertyName, name) pair always
  // reuses the same object reference. Set-based deduplication then works correctly.
  const importNameMemo = memo.create<string, ImportNameItem>()
  const canonicalizeName = (n: ImportNameItem): ImportNameItem => {
    if (typeof n === 'string') return n
    const key = `${n.propertyName}:${n.name ?? ''}`
    return memo(importNameMemo, key, () => n)
  }

  // Paths that keep at least one used named import. A default import from such a path is retained
  // even when its binding can't be found in `source` e.g. a generated `client` default import
  // alongside `import type { Client } from <same path>`, where merged grouped output omits the body.
  const pathsWithUsedNamedImport = new Set<string>()
  for (const node of known) {
    if (Array.isArray(node.name) && node.name.some((item) => isUsed(importLocalName(item)))) {
      pathsWithUsedNamedImport.add(node.path)
    }
  }

  const result: Array<ImportNode> = []
  const merge = mergeByPath(result)
  // Deduplicates non-array imports by their exact identity
  const seen = new Set<string>()

  for (const curr of sortMembers(known)) {
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

  const openImports = open.filter((node) => node.path !== node.root)
  return [...result, ...keepOpen(openImports, (item) => isUsed(item.alias ?? item.name))]
}
