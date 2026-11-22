/**
 * File-member merging. `combineImports` and `combineExports` deduplicate and sort the import and
 * export entries of one file, while `combineSources` deduplicates source entries in original order.
 * `combineImports` also drops imports nothing references. This works on a file's members, not on
 * schema content.
 */
import path from 'node:path'
import { memo } from '@internals/utils'
import type { ExportNode, ImportNode, ModuleName, SourceNode, Space } from '../nodes/file.ts'
import { getNames, getSpace, toDeprecatedExport, toDeprecatedImport } from './moduleNames.ts'

const IDENTIFIER_RUN = /[\w$]+/g

/**
 * How many imports a file needs before indexing the source beats scanning it once per name.
 */
const INDEX_ABOVE_IMPORTS = 128

// What one statement brings across: named members, the default export, or the whole module.
type Form = 'named' | 'default' | '*'

type Statement = { path: string; root?: string | null; form: Form; space?: Space | null; names: Array<ModuleName> }

const importForm = (item: ModuleName): Form => (item.alias && (item.name === '*' || item.name === 'default') ? item.name : 'named')
const exportForm = (item: ModuleName): Form => (item.name === '*' ? '*' : 'named')
const label = (item: ModuleName): string => (item.alias ? `${item.name} as ${item.alias}` : item.name)

// Named members of one path and space merge into one statement. A default or whole-module name is a statement of its own.
function statementKey({ path, form, space, names }: Statement): string {
  return form === 'named' ? `${path}\0named\0${space ?? ''}` : `${path}\0${form}\0${names[0]?.alias ?? ''}\0${space ?? ''}`
}

// One statement per form and space. A name without a space stays apart until `ast.file.resolveSpaces` fills it in.
function toStatements(nodes: ReadonlyArray<ImportNode | ExportNode>, formOf: (item: ModuleName) => Form): Array<Statement> {
  return nodes.flatMap((node) => {
    const statements = new Map<string, Statement>()
    for (const item of getNames(node)) {
      const statement: Statement = { path: node.path, root: node.kind === 'Import' ? node.root : undefined, form: formOf(item), space: item.space, names: [] }
      const key = statementKey({ ...statement, names: [item] })
      const existing = statements.get(key) ?? statement
      statements.set(key, existing)
      existing.names.push(item)
    }
    return [...statements.values()]
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
function specifier(node: { path: string; root?: string | null }): string {
  const { root, path: target } = node
  if (!root) return target
  const byPath = memo(specifierCache, root, () => new Map<string, string>())
  return memo(byPath, target, () => {
    const relative = path.relative(path.dirname(root), target).replaceAll('\\', '/')
    return relative.startsWith('../') ? relative : `./${relative}`
  })
}

// Default and whole-module statements first, then type, value, open space, then specifier and names.
function sortKey(statement: Statement): string {
  const form = statement.form === 'named' ? '1' : '0'
  const space = statement.space === 'type' ? '0' : statement.space === 'value' ? '1' : '2'
  return `${form}:${space}:${specifier(statement)}:${statement.names.map(label).toSorted().join('\0')}`
}

// Sorts statements, then merges each path and space in that order, once per bound name.
function mergeStatements(statements: Array<Statement>, keep: (item: ModuleName, statement: Statement) => boolean = () => true): Array<Statement> {
  const merged = new Map<string, { statement: Statement; seen: Set<string> }>()
  const sorted = statements.map((statement) => ({ statement, key: sortKey(statement) })).sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))

  for (const { statement } of sorted) {
    const key = statementKey(statement)
    const entry = merged.get(key) ?? { statement: { ...statement, names: [] }, seen: new Set<string>() }
    merged.set(key, entry)
    for (const item of statement.names) {
      const id = item.alias ?? item.name
      if (entry.seen.has(id) || !keep(item, statement)) continue
      entry.seen.add(id)
      entry.statement.names.push(item)
    }
  }

  return [...merged.values()].map(({ statement }) => statement).filter((statement) => statement.names.length > 0)
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
 * Deduplicates and merges `ExportNode` objects: one export per path, form and space. Returns a sorted array.
 */
export function combineExports(exports: Array<ExportNode>): Array<ExportNode> {
  return mergeStatements(toStatements(exports, exportForm)).map(({ path, names }) => ({ kind: 'Export', path, ...toDeprecatedExport(names), names }))
}

/**
 * Deduplicates and merges `ImportNode` objects, filtering out unused imports.
 *
 * Retains imports that are referenced in `source` or re-exported. One import per path, form and space. Returns
 * a sorted, deduplicated, filtered array.
 */
export function combineImports(imports: Array<ImportNode>, exports: Array<ExportNode>, source?: string): Array<ImportNode> {
  // Build a lookup of all exported names to retain imports that are re-exported
  const exportedNames = new Set(exports.flatMap((node) => getNames(node).map((item) => item.alias ?? item.name)))
  // `createFile` re-runs on every merge into a file, so scanning the source once per import name
  // costs a heavily merged file that scan again for every fragment it already holds. Indexing pays
  // for itself there, and costs more than it saves on the small files the default output produces.
  const identifiers = source && imports.length > INDEX_ABOVE_IMPORTS ? new Set(source.match(IDENTIFIER_RUN)) : null

  // A name in the index is used. One that is not still might be, inside a longer identifier, so the
  // substring test stays behind it.
  const isUsed = (importName: string): boolean => !source || identifiers?.has(importName) || source.includes(importName) || exportedNames.has(importName)

  const statements = toStatements(
    imports.filter((node) => node.path !== node.root),
    importForm,
  )

  // Paths that keep at least one used named import. A default import from such a path is retained
  // even when its binding can't be found in `source` e.g. a generated `client` default import
  // alongside `import type { Client } from <same path>`, where merged grouped output omits the body.
  const pathsWithUsedNamedImport = new Set(
    statements.filter(({ form, names }) => form === 'named' && names.some((item) => isUsed(item.alias ?? item.name))).map(({ path }) => path),
  )
  const keep = (item: ModuleName, { form, path }: Statement) => isUsed(item.alias ?? item.name) || (form !== 'named' && pathsWithUsedNamedImport.has(path))

  return mergeStatements(statements, keep).map(({ path, root, names }) => ({
    kind: 'Import',
    path,
    ...(root != null ? { root } : {}),
    ...toDeprecatedImport(names),
    names,
  }))
}
