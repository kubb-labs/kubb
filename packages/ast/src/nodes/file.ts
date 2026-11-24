import { nodeKinds } from '../constants.ts'
import { toDeprecatedExport, toDeprecatedImport } from '../utils/moduleNames.ts'
import { type BaseNode, nodeFactory } from './base.ts'
import type { CodeNode } from './code.ts'

/**
 * Supported file extensions.
 */
type Extname = '.ts' | '.js' | '.tsx' | '.json' | `.${string}`

type ImportName = string | Array<string | { propertyName: string; name?: string }>

/**
 * Whether a declaration exists only at compile time (`'type'`) or also at runtime (`'value'`).
 */
export type Space = 'type' | 'value'

/**
 * One name an import or export brings across, as in the ECMAScript `ImportEntry` record.
 */
export type ModuleName = {
  /**
   * Name in the other module: `'default'` for its default export, `'*'` for the whole module.
   */
  name: string
  /**
   * Local name for an import, or the exported name for an export.
   */
  alias?: string | null
  /**
   * Type or value.
   * @default 'value'
   */
  space?: Space | null
}

/**
 * Represents a language-agnostic import/dependency declaration.
 *
 * @example Named import (TypeScript: `import { useState } from 'react'`)
 * ```ts
 * createImport({ names: [{ name: 'useState' }], path: 'react' })
 * ```
 *
 * @example Default import (TypeScript: `import React from 'react'`)
 * ```ts
 * createImport({ names: [{ name: 'default', alias: 'React' }], path: 'react' })
 * ```
 *
 * @example Type-only import (TypeScript: `import type { FC } from 'react'`)
 * ```ts
 * createImport({ names: [{ name: 'FC', space: 'type' }], path: 'react' })
 * ```
 *
 * @example Namespace import (TypeScript: `import * as React from 'react'`)
 * ```ts
 * createImport({ names: [{ name: '*', alias: 'React' }], path: 'react' })
 * ```
 */
export type ImportNode = BaseNode & {
  kind: 'Import'
  /**
   * The names the import brings in. `ast.file.getNames` also reads the deprecated fields.
   */
  names?: Array<ModuleName> | null
  /**
   * Import name(s) to be used.
   *
   * @deprecated Use `names`. Removed in Kubb v6.
   */
  name: ImportName
  /**
   * Path for the import.
   *
   * @example
   * `'@kubb/core'`
   */
  path: string
  /**
   * Add a type-only import prefix.
   *
   * @deprecated Set `space: 'type'` on each name. Removed in Kubb v6.
   */
  isTypeOnly?: boolean | null
  /**
   * Import the entire module as a namespace.
   *
   * @deprecated Use `{ name: '*', alias }` in `names`. Removed in Kubb v6.
   */
  isNameSpace?: boolean | null
  /**
   * When set, the import path is resolved relative to this root.
   */
  root?: string | null
}

/**
 * Represents a language-agnostic export/public API declaration.
 *
 * @example Named export (TypeScript: `export { Pets } from './Pets'`)
 * ```ts
 * createExport({ names: [{ name: 'Pets' }], path: './Pets' })
 * ```
 *
 * @example Type-only export (TypeScript: `export type { Pet } from './Pet'`)
 * ```ts
 * createExport({ names: [{ name: 'Pet', space: 'type' }], path: './Pet' })
 * ```
 *
 * @example Wildcard export (TypeScript: `export * from './utils'`)
 * ```ts
 * createExport({ names: [{ name: '*' }], path: './utils' })
 * ```
 *
 * @example Namespace alias (TypeScript: `export * as utils from './utils'`)
 * ```ts
 * createExport({ names: [{ name: '*', alias: 'utils' }], path: './utils' })
 * ```
 */
export type ExportNode = BaseNode & {
  kind: 'Export'
  /**
   * The names the export passes on. `ast.file.getNames` also reads the deprecated fields.
   */
  names?: Array<ModuleName> | null
  /**
   * Export name(s) to be used. When omitted, generates a wildcard export.
   *
   * @deprecated Use `names`. Removed in Kubb v6.
   */
  name?: string | Array<string> | null
  /**
   * Path for the export.
   *
   * @example
   * `'@kubb/core'`
   */
  path: string
  /**
   * Add a type-only export prefix.
   *
   * @deprecated Set `space: 'type'` on each name. Removed in Kubb v6.
   */
  isTypeOnly?: boolean | null
  /**
   * Export as an aliased namespace.
   *
   * @deprecated Use `{ name: '*', alias }` in `names`. Removed in Kubb v6.
   */
  asAlias?: boolean | null
}

/**
 * Represents a fragment of source code within a file.
 *
 * @example Named exportable source
 * ```ts
 * createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')], export: true })
 * ```
 *
 * @example Inline unnamed code block
 * ```ts
 * createSource({ nodes: [createText('const x = 1')] })
 * ```
 */
export type SourceNode = BaseNode & {
  kind: 'Source'
  /**
   * Optional name identifying this source (used for deduplication and barrel generation).
   */
  name?: string | null
  /**
   * Type or value. When unset, a source whose first node is a `Type` is a type.
   */
  space?: Space | null
  /**
   * Mark this source as a type-only export.
   *
   * @deprecated Use `space: 'type'`. Removed in Kubb v6.
   */
  isTypeOnly?: boolean | null
  /**
   * Mark this source as an exported declaration, which barrels list. The source text carries its own `export` keyword.
   */
  export?: boolean | null
  /**
   * Mark this exported source as the module's default export. Barrels skip it, since they can't re-export it by name.
   */
  default?: boolean | null
  /**
   * @deprecated Use `export`. Removed in Kubb v6.
   */
  isExportable?: boolean | null
  /**
   * @deprecated Use `export`. Removed in Kubb v6.
   */
  isIndexable?: boolean | null
  /**
   * Marks the source as a definition that importing files absorb instead of import. `expression` is
   * the declaration's right-hand side, such as `{ body: Pet }`.
   *
   * @deprecated Set `inline` on the file. Removed in Kubb v6.
   */
  inline?: { expression: string } | null
  /**
   * Child nodes that make up this source fragment, in DOM order.
   * Use a {@link TextNode} for raw string content.
   */
  nodes?: Array<CodeNode>
}

/**
 * Represents a fully resolved file in the AST.
 *
 * Created via `createFile()`, which computes the `id`, `name`, and `extname` from the input
 * and deduplicates `imports`, `exports`, and `sources`.
 *
 * @example
 * ```ts
 * const file = createFile({
 *   baseName: 'petStore.ts',
 *   path: 'src/models/petStore.ts',
 *   sources: [createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')], export: true })],
 *   imports: [createImport({ name: ['z'], path: 'zod' })],
 *   exports: [createExport({ name: ['Pet'], path: './petStore' })],
 * })
 * // file.id   = SHA256 hash of the path
 * // file.name = 'petStore'
 * // file.extname = '.ts'
 * ```
 */
export type FileNode<TMeta extends object = object> = BaseNode & {
  kind: 'File'
  /**
   * Unique identifier derived from a SHA256 hash of the file path. `createFile`
   * computes it, so callers do not need to provide it.
   */
  id: string
  /**
   * File name without extension, derived from `baseName`.
   *
   * @see https://nodejs.org/api/path.html#pathformatpathobject
   */
  name: string
  /**
   * File base name, including extension, shaped like `${name}${extname}`.
   *
   * @see https://nodejs.org/api/path.html#pathbasenamepath-suffix
   */
  baseName: `${string}.${string}`
  /**
   * Full qualified path to the file.
   */
  path: string
  /**
   * File extension extracted from `baseName`.
   */
  extname: Extname
  /**
   * Deduplicated list of source code fragments.
   */
  sources: Array<SourceNode>
  /**
   * Deduplicated list of import declarations.
   */
  imports: Array<ImportNode>
  /**
   * Deduplicated list of export declarations.
   */
  exports: Array<ExportNode>
  /**
   * Optional metadata attached to this file, read by plugins during barrel generation.
   */
  meta?: TMeta
  /**
   * Optional banner prepended to the generated file content.
   * Accepts `null` so `resolver.default.banner()` results can be passed directly.
   */
  banner?: string | null
  /**
   * Optional footer appended to the generated file content.
   * Accepts `null` so `resolver.default.footer()` results can be passed directly.
   */
  footer?: string | null
  /**
   * Absolute on-disk path to copy into the output, through the parser's `copy` hook when it has one.
   *
   * Use to emit a real source file shipped inside a package (a template) into the generated
   * folder. When set, `copy` provides the file content and any `sources` nodes are ignored for
   * output; `sources` may still carry `name`/`export` so barrel generation
   * treats the file the same as a rendered one.
   */
  copy?: string | null
  /**
   * Marks a file that is never written. Each file that imports from it gets the body of each imported declaration, such as `{ body: Pet }`, in place of its name.
   */
  inline?: boolean | null
}

export type ImportInput = Omit<ImportNode, 'kind' | 'name'> & { name?: ImportName }

export type ExportInput = Omit<ExportNode, 'kind'>

// A spread node carries the deprecated fields derived from its `names`, so only a value that differs is an override.
type Override<TValue> = { value: TValue | null | undefined; derived: TValue | null | undefined }

function overrideSpace(names: Array<ModuleName>, { value, derived }: Override<boolean>): Array<ModuleName> {
  if (value == null || value === derived) return names
  const space = value ? 'type' : 'value'
  return names.map((item) => ({ ...item, space }))
}

const isOverride = ({ value, derived }: Override<unknown>): boolean => value !== undefined && JSON.stringify(value) !== JSON.stringify(derived)

// Object spread copies symbol keys, so `{ ...imp, names }` carries the fields `imp` derived and they can be told apart from an override.
const DERIVED = Symbol.for('kubb.ast.derived')
// `name` is stored as JSON, so changing the node's `name` array in place still counts as an override.
type Derived = { name: string | undefined; isTypeOnly?: boolean | null }
type WithDerived = { [DERIVED]?: Derived }

/** The deprecated fields the caller set: a value equal to the one the spread node derived is dropped, so `names` decides it. */
function ownFields<TName>(input: { name?: TName; isTypeOnly?: boolean | null } & WithDerived): { name?: TName; isTypeOnly?: boolean | null } {
  const snapshot = input[DERIVED]
  if (!snapshot) return { name: input.name, isTypeOnly: input.isTypeOnly }
  return {
    name: JSON.stringify(input.name) === snapshot.name ? undefined : input.name,
    isTypeOnly: input.isTypeOnly === snapshot.isTypeOnly ? undefined : input.isTypeOnly,
  }
}

function withoutDerived<T extends object>(input: T): T {
  const { [DERIVED]: _, ...rest } = input as T & WithDerived
  return rest as T
}

/**
 * Creates an `ImportNode`. A node built from `names` also gets the deprecated fields. A deprecated `name` or
 * `isTypeOnly` that differs from the one `names` gives overrides it, so `{ ...imp, isTypeOnly: true }` still works.
 * Fields a spread copies over unchanged are not overrides, so `{ ...imp, names }` uses the new `names`.
 *
 * @example Named import
 * ```ts
 * createImport({ names: [{ name: 'useState' }], path: 'react' })
 * // import { useState } from 'react'
 * ```
 */
export function createImport(input: ImportInput): ImportNode {
  if (!input.names) return { ...withoutDerived(input), name: input.name ?? [], kind: nodeKinds.import }
  const own = ownFields(input)
  const derived = toDeprecatedImport(input.names)
  if (isOverride({ value: own.name, derived: derived.name })) return { ...withoutDerived(input), names: null, name: own.name ?? [], kind: nodeKinds.import }
  const names = overrideSpace(input.names, { value: own.isTypeOnly, derived: derived.isTypeOnly })
  const fields = toDeprecatedImport(names)
  const node: ImportNode & WithDerived = {
    ...input,
    ...fields,
    names,
    [DERIVED]: { name: JSON.stringify(fields.name), isTypeOnly: fields.isTypeOnly },
    kind: nodeKinds.import,
  }
  return node
}

/**
 * Creates an `ExportNode`. A node built from `names` also gets the deprecated fields. A deprecated `name` or
 * `isTypeOnly` that differs from the one `names` gives overrides it. Fields a spread copies over unchanged are not
 * overrides, so `{ ...exp, names }` uses the new `names`.
 *
 * @example Named export
 * ```ts
 * createExport({ names: [{ name: 'Pet' }], path: './Pet' })
 * // export { Pet } from './Pet'
 * ```
 */
export function createExport(input: ExportInput): ExportNode {
  if (!input.names) return { ...withoutDerived(input), kind: nodeKinds.export }
  const own = ownFields(input)
  const derived = toDeprecatedExport(input.names)
  if (isOverride({ value: own.name, derived: derived.name })) return { ...withoutDerived(input), name: own.name, names: null, kind: nodeKinds.export }
  const names = overrideSpace(input.names, { value: own.isTypeOnly, derived: derived.isTypeOnly })
  const fields = toDeprecatedExport(names)
  const node: ExportNode & WithDerived = {
    ...input,
    ...fields,
    name: fields.name,
    names,
    [DERIVED]: { name: JSON.stringify(fields.name), isTypeOnly: fields.isTypeOnly },
    kind: nodeKinds.export,
  }
  return node
}

/**
 * Creates a `SourceNode` representing a fragment of source code within a file.
 *
 * @example
 * ```ts
 * createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')], export: true })
 * ```
 */
export const createSource = nodeFactory<SourceNode>(nodeKinds.source)

/**
 * Input descriptor for {@link createFile}, before `id`, `name`, and `extname` are computed
 * and `imports`/`exports`/`sources` are deduplicated.
 */
export type UserFileNode<TMeta extends object = object> = Omit<FileNode<TMeta>, 'kind' | 'id' | 'name' | 'extname' | 'imports' | 'exports' | 'sources'> &
  Pick<Partial<FileNode<TMeta>>, 'imports' | 'exports' | 'sources'>
