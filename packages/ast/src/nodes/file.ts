import { hash } from 'node:crypto'
import path from 'node:path'
import { trimExtName } from '@internals/utils'
import { defineNode } from '../defineNode.ts'
import { extractStringsFromNodes } from '../utils/extractStringsFromNodes.ts'
import { combineExports, combineImports, combineSources } from '../utils/fileMerge.ts'
import type { BaseNode } from './base.ts'
import type { CodeNode } from './code.ts'

/**
 * Supported file extensions.
 */
type Extname = '.ts' | '.js' | '.tsx' | '.json' | `.${string}`

type ImportName = string | Array<string | { propertyName: string; name?: string }>

/**
 * Represents a language-agnostic import/dependency declaration.
 *
 * @example Named import (TypeScript: `import { useState } from 'react'`)
 * ```ts
 * createImport({ name: ['useState'], path: 'react' })
 * ```
 *
 * @example Default import (TypeScript: `import React from 'react'`)
 * ```ts
 * createImport({ name: 'React', path: 'react' })
 * ```
 *
 * @example Type-only import (TypeScript: `import type { FC } from 'react'`)
 * ```ts
 * createImport({ name: ['FC'], path: 'react', isTypeOnly: true })
 * ```
 *
 * @example Namespace import (TypeScript: `import * as React from 'react'`)
 * ```ts
 * createImport({ name: 'React', path: 'react', isNameSpace: true })
 * ```
 */
export type ImportNode = BaseNode & {
  kind: 'Import'
  /**
   * Import name(s) to be used.
   *
   * @example Named imports
   * `['useState']`
   *
   * @example Default import
   * `'React'`
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
   * - `true` generates `import type { Type } from './path'`
   * - `false` generates `import { Type } from './path'`
   */
  isTypeOnly?: boolean | null
  /**
   * Import the entire module as a namespace.
   * - `true` generates `import * as Name from './path'`
   * - `false` generates a standard import
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
 * createExport({ name: ['Pets'], path: './Pets' })
 * ```
 *
 * @example Type-only export (TypeScript: `export type { Pet } from './Pet'`)
 * ```ts
 * createExport({ name: ['Pet'], path: './Pet', isTypeOnly: true })
 * ```
 *
 * @example Wildcard export (TypeScript: `export * from './utils'`)
 * ```ts
 * createExport({ path: './utils' })
 * ```
 *
 * @example Namespace alias (TypeScript: `export * as utils from './utils'`)
 * ```ts
 * createExport({ name: 'utils', path: './utils', asAlias: true })
 * ```
 */
export type ExportNode = BaseNode & {
  kind: 'Export'
  /**
   * Export name(s) to be used. When omitted, generates a wildcard export.
   *
   * @example Named exports
   * `['useState']`
   *
   * @example Single export
   * `'React'`
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
   * - `true` generates `export type { Type } from './path'`
   * - `false` generates `export { Type } from './path'`
   */
  isTypeOnly?: boolean | null
  /**
   * Export as an aliased namespace.
   * - `true` generates `export * as aliasName from './path'`
   * - `false` generates a standard export
   */
  asAlias?: boolean | null
}

/**
 * Represents a fragment of source code within a file.
 *
 * @example Named exportable source
 * ```ts
 * createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')], isExportable: true, isIndexable: true })
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
   * Mark this source as a type-only export.
   */
  isTypeOnly?: boolean | null
  /**
   * Include the `export` keyword in the generated source.
   */
  isExportable?: boolean | null
  /**
   * Include this source in barrel/index file generation.
   */
  isIndexable?: boolean | null
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
 *   sources: [createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')], isExportable: true })],
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
   * Accepts `null` so `resolver.resolveBanner()` results can be passed directly.
   */
  banner?: string | null
  /**
   * Optional footer appended to the generated file content.
   * Accepts `null` so `resolver.resolveFooter()` results can be passed directly.
   */
  footer?: string | null
  /**
   * Absolute on-disk path to copy verbatim into the output, bypassing the parser.
   *
   * Use to emit a real source file shipped inside a package (a template) into the generated
   * folder without reformatting or import reordering. Only `banner` and `footer` are applied
   * around the copied content. When set, `copy` provides the file content and any `sources`
   * nodes are ignored for output; `sources` may still carry `name`/`isExportable`/`isIndexable`
   * so barrel generation treats the file the same as a rendered one.
   */
  copy?: string | null
}

/**
 * Definition for the {@link ImportNode}.
 */
export const importDef = defineNode<ImportNode>({ kind: 'Import' })

/**
 * Definition for the {@link ExportNode}.
 */
export const exportDef = defineNode<ExportNode>({ kind: 'Export' })

/**
 * Definition for the {@link SourceNode}.
 */
export const sourceDef = defineNode<SourceNode>({ kind: 'Source' })

/**
 * Definition for the {@link FileNode}. The fully resolved builder lives in
 * `createFile`, so this definition only supplies the guard.
 */
export const fileDef = defineNode<FileNode>({ kind: 'File' })

/**
 * Creates an `ImportNode` representing a language-agnostic import/dependency declaration.
 *
 * @example Named import
 * ```ts
 * createImport({ name: ['useState'], path: 'react' })
 * // import { useState } from 'react'
 * ```
 */
export const createImport = importDef.create

/**
 * Creates an `ExportNode` representing a language-agnostic export/public API declaration.
 *
 * @example Named export
 * ```ts
 * createExport({ name: ['Pet'], path: './Pet' })
 * // export { Pet } from './Pet'
 * ```
 */
export const createExport = exportDef.create

/**
 * Creates a `SourceNode` representing a fragment of source code within a file.
 *
 * @example
 * ```ts
 * createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')], isExportable: true })
 * ```
 */
export const createSource = sourceDef.create

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
 * @example Copy a real file into the output verbatim
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

  // Skip building the source text and local-name set when there are no imports to resolve against them.
  const resolvedImports: Array<ImportNode> = (() => {
    if (!input.imports?.length) return []

    const sourceParts: Array<string> = []
    const localNames = new Set<string>()
    for (const item of input.sources ?? []) {
      const extracted = item.nodes && extractStringsFromNodes(item.nodes)
      if (extracted) sourceParts.push(extracted)
      if (item.name) localNames.add(item.name)
    }
    const source = sourceParts.join('\n') || undefined
    const combinedImports = combineImports(input.imports, resolvedExports, source)
    const nameOf = (item: string | { propertyName: string; name?: string }): string => (typeof item === 'string' ? item : (item.name ?? item.propertyName))
    // Consolidating output (`mode: 'file'`) can put a symbol's definition and an import of it in the
    // same file: by path when the import still targets this file, by name when consolidation moved it.
    return combinedImports.flatMap((imp) => {
      if (imp.path === input.path) return []
      if (!Array.isArray(imp.name)) {
        return typeof imp.name === 'string' && localNames.has(imp.name) ? [] : [imp]
      }
      const kept = imp.name.filter((item) => !localNames.has(nameOf(item)))

      if (!kept.length) return []
      return [kept.length === imp.name.length ? imp : { ...imp, name: kept }]
    })
  })()
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
