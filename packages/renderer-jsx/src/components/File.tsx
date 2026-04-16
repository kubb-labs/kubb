import type { ExportNode, ImportNode, SourceNode } from '@kubb/ast'
import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

type BasePropsWithBaseName = {
  /**
   * Base file name including extension, derived from the input path.
   * Based on UNIX basename convention: `${name}${extname}`.
   *
   * @link https://nodejs.org/api/path.html#pathbasenamepath-suffix
   *
   * @example
   * `baseName: 'petStore.ts'`
   */
  baseName: `${string}.${string}`
  /**
   * Fully qualified path to the generated file.
   *
   * @example
   * `path: 'src/models/petStore.ts'`
   */
  path: string
}

type BasePropsWithoutBaseName = {
  baseName?: never
  /**
   * Fully qualified path to the generated file.
   * Optional when `baseName` is omitted — the component renders its children inline.
   */
  path?: string
}

type BaseProps = BasePropsWithBaseName | BasePropsWithoutBaseName

type Props<TMeta> = BaseProps & {
  key?: Key
  /**
   * Arbitrary metadata attached to the file node.
   * Used by plugins for barrel generation and custom post-processing.
   */
  meta?: TMeta
  /**
   * Text prepended to the generated file content before any source blocks.
   */
  banner?: string
  /**
   * Text appended to the generated file content after all source blocks.
   */
  footer?: string
  /**
   * Child nodes rendered as the content of this file (source blocks, imports, exports).
   */
  children?: KubbReactNode
}

/**
 * Declares a generated file entry to be collected by the renderer.
 *
 * When both `baseName` and `path` are provided, the component registers a new
 * `FileNode` and passes its children through as source blocks.
 * When either is omitted the children are rendered inline without creating a file entry.
 *
 * @example Basic file with a source block
 * ```tsx
 * <File baseName="petStore.ts" path="src/models/petStore.ts">
 *   <File.Source name="Pet" isExportable isIndexable>
 *     {`export type Pet = { id: number; name: string }`}
 *   </File.Source>
 * </File>
 * ```
 */
export function File<TMeta extends object = object>({ children, ...props }: Props<TMeta>): KubbReactElement {
  const { baseName, path } = props

  if (!baseName || !path) {
    return <>{children}</>
  }

  return <kubb-file {...props}>{children}</kubb-file>
}

File.displayName = 'File'

type FileSourceProps = Omit<SourceNode, 'kind' | 'value'> & {
  key?: Key
  /**
   * Child nodes rendered as the source content of this block.
   */
  children?: KubbReactNode
}

/**
 * Marks a block of source text to be associated with the enclosing {@link File}.
 *
 * Children are treated as the source string. When `isExportable` is `true` the
 * `name` is used for deduplication and barrel generation.
 *
 * @example Exportable, indexable source block
 * ```tsx
 * <File.Source name="Pet" isExportable isIndexable>
 *   {`export type Pet = { id: number; name: string }`}
 * </File.Source>
 * ```
 *
 * @example Type-only source block
 * ```tsx
 * <File.Source name="PetId" isTypeOnly isExportable>
 *   {`export type PetId = string`}
 * </File.Source>
 * ```
 */
function FileSource({ children, ...props }: FileSourceProps): KubbReactElement {
  const { name, isExportable, isIndexable, isTypeOnly } = props

  return (
    <kubb-source name={name} isTypeOnly={isTypeOnly} isExportable={isExportable} isIndexable={isIndexable}>
      {children}
    </kubb-source>
  )
}

FileSource.displayName = 'FileSource'

type FileExportProps = Omit<ExportNode, 'kind'> & { key?: Key }

/**
 * Declares an export entry for the enclosing {@link File}.
 *
 * The export is collected by the renderer and emitted at the top of the generated file.
 *
 * @example Named export
 * ```tsx
 * <File.Export name={['Pet']} path="./models/petStore" />
 * // export { Pet } from './models/petStore'
 * ```
 *
 * @example Type-only wildcard export
 * ```tsx
 * <File.Export path="./models/petStore" isTypeOnly />
 * // export type * from './models/petStore'
 * ```
 */
function FileExport(props: FileExportProps): KubbReactElement {
  const { name, path, isTypeOnly, asAlias } = props

  return <kubb-export name={name} path={path} isTypeOnly={isTypeOnly} asAlias={asAlias} />
}

FileExport.displayName = 'FileExport'

type FileImportProps = Omit<ImportNode, 'kind'> & { key?: Key }

/**
 * Declares an import entry for the enclosing {@link File}.
 *
 * The import is collected by the renderer and emitted at the top of the generated file.
 *
 * @example Named import
 * ```tsx
 * <File.Import name={['useState']} path="react" />
 * // import { useState } from 'react'
 * ```
 *
 * @example Type-only import
 * ```tsx
 * <File.Import name={['Pet']} path="./models" isTypeOnly />
 * // import type { Pet } from './models'
 * ```
 *
 * @example Namespace import
 * ```tsx
 * <File.Import name="z" path="zod" isNameSpace />
 * // import * as z from 'zod'
 * ```
 */
function FileImport(props: FileImportProps): KubbReactElement {
  const { name, root, path, isTypeOnly, isNameSpace } = props

  return <kubb-import name={name} root={root} path={path} isNameSpace={isNameSpace} isTypeOnly={isTypeOnly} />
}

FileImport.displayName = 'FileImport'

File.Export = FileExport
File.Import = FileImport
File.Source = FileSource
