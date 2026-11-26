import type { ExportNode, ImportNode, ModuleName, SourceNode, Space } from '../nodes/file.ts'

/**
 * Returns the names an import or export brings across. A node built with the deprecated fields gets them from
 * those, each with an explicit `space`, so it prints exactly as before.
 */
/**
 * The name an import or export entry binds in its file: its alias, or else its name.
 */
export function localName(item: ModuleName): string {
  return item.alias ?? item.name
}

export function getNames(node: ImportNode | ExportNode): Array<ModuleName> {
  if (node.names) return node.names
  return node.kind === 'Import' ? fromDeprecatedImport(node) : fromDeprecatedExport(node)
}

/**
 * Returns `true` when a source is an exported declaration. Reads the deprecated `isIndexable` and `isExportable`, in that order, when `export` is unset.
 */
export function isExported(source: Pick<SourceNode, 'export' | 'isIndexable' | 'isExportable'>): boolean {
  return !!(source.export ?? source.isIndexable ?? source.isExportable)
}

export function getSpace(source: SourceNode): Space {
  if (source.space) return source.space
  if (source.isTypeOnly != null) return source.isTypeOnly ? 'type' : 'value'
  return source.nodes?.[0]?.kind === 'Type' ? 'type' : 'value'
}

export type DeprecatedImport = Pick<ImportNode, 'name' | 'isTypeOnly' | 'isNameSpace'>
export type DeprecatedExport = Pick<ExportNode, 'name' | 'isTypeOnly' | 'asAlias'>

/**
 * @deprecated Converts a node built with `name`, `isTypeOnly` and `isNameSpace` to `names`. Removed in Kubb v6.
 */
function fromDeprecatedImport({ name, isTypeOnly, isNameSpace }: DeprecatedImport): Array<ModuleName> {
  const space: Space = isTypeOnly ? 'type' : 'value'
  if (!Array.isArray(name)) return [{ name: isNameSpace ? '*' : 'default', alias: name, space }]
  return name.map((item) => (typeof item === 'string' ? { name: item, space } : { name: item.propertyName, ...(item.name ? { alias: item.name } : {}), space }))
}

/**
 * @deprecated Converts a node built with `name`, `isTypeOnly` and `asAlias` to `names`. Removed in Kubb v6.
 */
function fromDeprecatedExport({ name, isTypeOnly, asAlias }: DeprecatedExport): Array<ModuleName> {
  const space: Space = isTypeOnly ? 'type' : 'value'
  if (name == null) return [{ name: '*', space }]
  if (!Array.isArray(name)) return [asAlias ? { name: '*', alias: name, space } : { name, space }]
  return name.map((item) => ({ name: item, space }))
}

/**
 * @deprecated The old import fields for `names`, for code that still reads them. Removed in Kubb v6.
 */
export function toDeprecatedImport(names: ReadonlyArray<ModuleName>): DeprecatedImport {
  const isTypeOnly = names.length > 0 && names.every((item) => item.space === 'type')
  const [first] = names
  if (names.length === 1 && first?.alias && (first.name === '*' || first.name === 'default')) {
    return { name: first.alias, isTypeOnly, isNameSpace: first.name === '*' }
  }
  return { name: names.map((item) => (item.alias ? { propertyName: item.name, name: item.alias } : item.name)), isTypeOnly, isNameSpace: false }
}

/**
 * @deprecated The old export fields for `names`; an alias stands in for its name. Removed in Kubb v6.
 */
export function toDeprecatedExport(names: ReadonlyArray<ModuleName>): DeprecatedExport {
  const isTypeOnly = names.length > 0 && names.every((item) => item.space === 'type')
  const [first] = names
  if (names.length === 1 && first?.name === '*') {
    return first.alias ? { name: first.alias, isTypeOnly, asAlias: true } : { isTypeOnly, asAlias: false }
  }
  return { name: names.map(localName), isTypeOnly, asAlias: false }
}
