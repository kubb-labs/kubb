import type { ast } from '@kubb/ast'
import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

type BasePropsWithBaseName = Pick<ast.FileNode, 'baseName' | 'path'>

type BasePropsWithoutBaseName = {
  baseName?: never
  /**
   * Fully qualified path to the generated file.
   * Optional when `baseName` is omitted, the component renders its children inline.
   */
  path?: string | null
}

type BaseProps = BasePropsWithBaseName | BasePropsWithoutBaseName

type Props<TMeta extends object> = BaseProps &
  Pick<ast.UserFileNode<TMeta>, 'banner' | 'footer' | 'copy'> & {
    key?: Key
    /**
     * Arbitrary metadata attached to the file node for plugins to read.
     */
    meta?: TMeta | null
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
  if (!props.baseName || !props.path) {
    return <>{children}</>
  }

  return <kubb-file {...props}>{children}</kubb-file>
}

type FileSourceProps = Omit<ast.SourceNode, 'kind' | 'value'> & {
  key?: Key
  /**
   * Child nodes rendered as the source content of this block.
   */
  children?: KubbReactNode
}

/**
 * Marks a block of source text to be associated with the enclosing {@link File}.
 *
 * Children are treated as the source string. `isExportable` prepends the `export` keyword,
 * `isIndexable` includes the source in barrel/index generation, and `name` keys deduplication.
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
  return <kubb-source {...props}>{children}</kubb-source>
}

type FileExportProps = Omit<ast.ExportNode, 'kind'> & { key?: Key }

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
  return <kubb-export {...props} />
}

type FileImportProps = Omit<ast.ImportNode, 'kind'> & { key?: Key }

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
  return <kubb-import {...props} />
}

File.Export = FileExport
File.Import = FileImport
File.Source = FileSource
