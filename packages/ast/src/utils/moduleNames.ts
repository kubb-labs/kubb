/**
 * Converts between the language-agnostic `names` of an import or export and the deprecated
 * TypeScript-shaped fields (`name`, `isTypeOnly`, `isNameSpace`, `asAlias`), and reads the space of a
 * declaration. Both shapes stay readable until the deprecated fields are removed in Kubb v6.
 */
import type { ExportNode, ImportNode, ModuleName, SourceNode, Space } from '../nodes/file.ts'

type ImportFields = Pick<ImportNode, 'name' | 'isTypeOnly' | 'isNameSpace'>
type ExportFields = Pick<ExportNode, 'name' | 'isTypeOnly' | 'asAlias'>

/**
 * The deprecated import fields that describe the same import as `names`.
 */
export function importFields(names: ReadonlyArray<ModuleName>): ImportFields {
  const isTypeOnly = names.length > 0 && names.every((item) => item.space === 'type')
  const [first] = names
  if (names.length === 1 && first?.alias && (first.name === '*' || first.name === 'default')) {
    return { name: first.alias, isTypeOnly, isNameSpace: first.name === '*' }
  }
  return { name: names.map((item) => (item.alias ? { propertyName: item.name, name: item.alias } : item.name)), isTypeOnly, isNameSpace: false }
}

/**
 * The deprecated export fields that describe the same export as `names`. An alias on a named export has no
 * deprecated form, so the exported name stands in for it.
 */
export function exportFields(names: ReadonlyArray<ModuleName>): ExportFields {
  const isTypeOnly = names.length > 0 && names.every((item) => item.space === 'type')
  const [first] = names
  if (names.length === 1 && first?.name === '*') {
    return first.alias ? { name: first.alias, isTypeOnly, asAlias: true } : { isTypeOnly, asAlias: false }
  }
  return { name: names.map((item) => item.alias ?? item.name), isTypeOnly, asAlias: false }
}

/**
 * Whether `node`'s deprecated fields still describe its `names`. They stop doing so when code copies a node
 * and changes only a deprecated field, such as `{ ...imp, isTypeOnly: true }`; that change then wins.
 */
export function matchesFields(node: ImportFields | ExportFields, fields: ImportFields | ExportFields): boolean {
  return (
    JSON.stringify(node.name ?? null) === JSON.stringify(fields.name ?? null) &&
    !!node.isTypeOnly === !!fields.isTypeOnly &&
    !!('isNameSpace' in node && node.isNameSpace) === !!('isNameSpace' in fields && fields.isNameSpace) &&
    !!('asAlias' in node && node.asAlias) === !!('asAlias' in fields && fields.asAlias)
  )
}

/**
 * Returns the names an import or export brings across. Nodes built with the deprecated fields get names with
 * an explicit `space`, so they print exactly as before.
 *
 * @example
 * ```ts
 * getNames(createImport({ name: 'z', path: 'zod', isNameSpace: true }))
 * // [{ name: '*', alias: 'z', space: 'value' }]
 * ```
 */
export function getNames(node: ImportNode | ExportNode): Array<ModuleName> {
  if (node.kind === 'Import') {
    if (node.names && matchesFields(node, importFields(node.names))) return node.names
    const space: Space = node.isTypeOnly ? 'type' : 'value'
    if (!Array.isArray(node.name)) return [{ name: node.isNameSpace ? '*' : 'default', alias: node.name, space }]
    return node.name.map((item) =>
      typeof item === 'string' ? { name: item, space } : { name: item.propertyName, ...(item.name ? { alias: item.name } : {}), space },
    )
  }

  if (node.names && matchesFields(node, exportFields(node.names))) return node.names
  const space: Space = node.isTypeOnly ? 'type' : 'value'
  if (node.name == null) return [{ name: '*', space }]
  if (!Array.isArray(node.name)) return [node.asAlias ? { name: '*', alias: node.name, space } : { name: node.name, space }]
  return node.name.map((name) => ({ name, space }))
}

/**
 * Returns whether a declaration exists only at compile time (`type`) or also at runtime (`value`). Without
 * `space` or the deprecated `isTypeOnly`, a source whose first node is a `Type` is a type.
 *
 * @example
 * ```ts
 * getSpace(createSource({ name: 'Pet', nodes: [createType({ name: 'Pet', export: true })] }))
 * // 'type'
 * ```
 */
export function getSpace(source: SourceNode): Space {
  if (source.space) return source.space
  if (source.isTypeOnly != null) return source.isTypeOnly ? 'type' : 'value'
  return source.nodes?.[0]?.kind === 'Type' ? 'type' : 'value'
}
