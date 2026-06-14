import { defineNode } from '../node.ts'
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
   * @link https://nodejs.org/api/path.html#pathformatpathobject
   */
  name: string
  /**
   * File base name, including extension.
   * Based on UNIX basename: `${name}${extname}`
   * @link https://nodejs.org/api/path.html#pathbasenamepath-suffix
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
}

/**
 * Definition for the {@link ImportNode}.
 */
export const importDef = defineNode<ImportNode>({ kind: 'Import' })

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
 * Definition for the {@link ExportNode}.
 */
export const exportDef = defineNode<ExportNode>({ kind: 'Export' })

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
 * Definition for the {@link SourceNode}.
 */
export const sourceDef = defineNode<SourceNode>({ kind: 'Source' })

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
 * Definition for the {@link FileNode}. The fully resolved builder lives in
 * `createFile`, so this definition only supplies the guard.
 */
export const fileDef = defineNode<FileNode>({ kind: 'File' })
