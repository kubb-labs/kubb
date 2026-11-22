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
  Pick<ast.UserFileNode<TMeta>, 'banner' | 'footer' | 'copy' | 'inline'> & {
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
 *   <Code name="petSchema" export>
 *     {`export const petSchema = z.object({ id: z.number() })`}
 *   </Code>
 * </File>
 * ```
 */
export function File<TMeta extends object = object>({ children, ...props }: Props<TMeta>): KubbReactElement {
  if (!props.baseName || !props.path) {
    return <>{children}</>
  }

  return <kubb-file {...props}>{children}</kubb-file>
}

type FileSourceProps = Omit<ast.SourceNode, 'kind' | 'value' | 'nodes'> & {
  key?: Key
  /**
   * Child nodes rendered as the source content of this block.
   */
  children?: KubbReactNode
}

/**
 * A block of source text in the enclosing {@link File}.
 *
 * @deprecated Use `Code` or `Raw`, or put `Const`, `Type` or `Function` directly in `File`. Removed in Kubb v6.
 */
function FileSource({ children, name, pointer, export: isExport, default: isDefault, isIndexable, isTypeOnly, inline }: FileSourceProps): KubbReactElement {
  return (
    <kubb-origin pointer={pointer}>
      <kubb-code name={name} export={isExport ?? isIndexable} default={isDefault} isTypeOnly={isTypeOnly} inline={inline}>
        {children}
      </kubb-code>
    </kubb-origin>
  )
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
/** @deprecated Use `Code` or `Raw`, or put `Const`, `Type` or `Function` directly in `File`. Removed in Kubb v6. */
File.Source = FileSource
