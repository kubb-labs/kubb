import { hash } from 'node:crypto'
import path from 'node:path'
import { nodeKinds } from '../constants.ts'
import { combineExports, combineImports, combineSources, importLocalName } from '../utils/combineFileMembers.ts'
import { exportFields, importFields, matchesFields } from '../utils/moduleNames.ts'
import { getNodeText } from '../utils/nodeText.ts'
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
 * One name an import or export brings across, in any language. Follows the ECMAScript `ImportEntry` record.
 *
 * @example Named import with an alias (TypeScript: `import { fakerEN as faker }`)
 * `{ name: 'fakerEN', alias: 'faker' }`
 *
 * @example Default import (TypeScript: `import useSWR from 'swr'`)
 * `{ name: 'default', alias: 'useSWR' }`
 *
 * @example Whole module (TypeScript: `import * as z from 'zod'`)
 * `{ name: '*', alias: 'z' }`
 */
export type ModuleName = {
  /**
   * Name in the other module. `'default'` is its default export and `'*'` the whole module.
   */
  name: string
  /**
   * Local name for an import, or the exported name for an export.
   */
  alias?: string | null
  /**
   * Whether the name is a type or a value. When it is not set, the space of the declaration it points to is
   * used before the file is printed.
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
   * The names the import brings in. Read them with `ast.file.getNames`, which also covers nodes built with
   * the deprecated fields.
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
   * The names the export passes on. Read them with `ast.file.getNames`, which also covers nodes built with
   * the deprecated fields.
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
   * Whether the declaration is a type or a value. When it is not set, a source whose first node is a `Type`
   * is a type. Read it with `ast.file.getSpace`.
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

/**
 * Input for {@link createImport}: `names`, or the deprecated `name` with `isTypeOnly` and `isNameSpace`.
 */
export type ImportInput = Omit<ImportNode, 'kind' | 'name'> & { name?: ImportName }

/**
 * Input for {@link createExport}: `names`, or the deprecated `name` with `isTypeOnly` and `asAlias`.
 */
export type ExportInput = Omit<ExportNode, 'kind'>

/**
 * Creates an `ImportNode` representing a language-agnostic import/dependency declaration. A node built
 * from `names` also carries the deprecated fields, so code that still reads them keeps working. When both
 * are passed and the deprecated fields describe a different import, those win.
 *
 * @example Named import
 * ```ts
 * createImport({ names: [{ name: 'useState' }], path: 'react' })
 * // import { useState } from 'react'
 * ```
 */
export function createImport(input: ImportInput): ImportNode {
  if (input.names) {
    // Without a deprecated `name`, a deprecated `isTypeOnly` only marks every name as a type.
    const names = input.name === undefined && input.isTypeOnly ? input.names.map((item) => ({ ...item, space: 'type' as const })) : input.names
    const fields = importFields(names)
    if (input.name === undefined || matchesFields({ ...input, name: input.name }, fields)) return { ...input, ...fields, names, kind: nodeKinds.import }
  }
  const { names: _names, ...rest } = input
  return { ...rest, name: rest.name ?? [], kind: nodeKinds.import }
}

/**
 * Creates an `ExportNode` representing a language-agnostic export/public API declaration. A node built
 * from `names` also carries the deprecated fields, so code that still reads them keeps working. When both
 * are passed and the deprecated fields describe a different export, those win.
 *
 * @example Named export
 * ```ts
 * createExport({ names: [{ name: 'Pet' }], path: './Pet' })
 * // export { Pet } from './Pet'
 * ```
 */
export function createExport(input: ExportInput): ExportNode {
  if (input.names) {
    // Without a deprecated `name` or `asAlias`, a deprecated `isTypeOnly` only marks every name as a type.
    const onlyFlag = input.name === undefined && !input.asAlias
    const names = onlyFlag && input.isTypeOnly ? input.names.map((item) => ({ ...item, space: 'type' as const })) : input.names
    const fields = exportFields(names)
    if (onlyFlag || matchesFields(input, fields)) return { ...input, ...fields, names, kind: nodeKinds.export }
  }
  const { names: _names, ...rest } = input
  return { ...rest, kind: nodeKinds.export }
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
      // An import whose space is still open keeps its `names`, so they must change with it.
      if (imp.names) {
        const kept = imp.names.filter((item) => !localNames.has(item.alias ?? item.name))
        if (!kept.length) return []
        return [kept.length === imp.names.length ? imp : createImport({ ...imp, name: undefined, isTypeOnly: undefined, isNameSpace: undefined, names: kept })]
      }
      if (!Array.isArray(imp.name)) {
        return typeof imp.name === 'string' && localNames.has(imp.name) ? [] : [imp]
      }
      const kept = imp.name.filter((item) => !localNames.has(importLocalName(item)))

      if (!kept.length) return []
      return [kept.length === imp.name.length ? imp : { ...imp, name: kept }]
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
