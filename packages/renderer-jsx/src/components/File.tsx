import { ast } from '@kubb/ast'
import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

export type BasePropsWithBaseName = Pick<ast.FileNode, 'baseName' | 'path'>

export type BasePropsWithoutBaseName = {
  baseName?: never
  /**
   * Fully qualified path to the generated file.
   * Optional when `baseName` is omitted, the component renders its children inline.
   */
  path?: string | null
}

export type BaseProps = BasePropsWithBaseName | BasePropsWithoutBaseName

export type FileProps<TMeta extends object> = BaseProps &
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
export function File<TMeta extends object = object>({ children, ...props }: FileProps<TMeta>): KubbReactElement {
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
function FileSource({
  children,
  name,
  pointer,
  export: isExport,
  default: isDefault,
  isIndexable,
  isExportable,
  space,
  isTypeOnly,
  inline,
}: FileSourceProps): KubbReactElement {
  return (
    <kubb-origin pointer={pointer}>
      <kubb-code
        name={name}
        export={ast.file.isExported({ export: isExport, isIndexable, isExportable })}
        default={isDefault}
        space={space}
        isTypeOnly={isTypeOnly}
        inline={inline}
      >
        {children}
      </kubb-code>
    </kubb-origin>
  )
}

type FileExportProps = ast.ExportInput & { key?: Key }

/**
 * Declares an export entry for the enclosing {@link File}.
 *
 * The export is collected by the renderer and emitted at the top of the generated file. A name without a
 * `space` is a value.
 *
 * @example Named export
 * ```tsx
 * <File.Export names={[{ name: 'Pet' }]} path="./models/petStore" />
 * // export { Pet } from './models/petStore'
 * ```
 *
 * @example Type-only wildcard export
 * ```tsx
 * <File.Export names={[{ name: '*', space: 'type' }]} path="./models/petStore" />
 * // export type * from './models/petStore'
 * ```
 */
function FileExport(props: FileExportProps): KubbReactElement {
  return <kubb-export {...props} />
}

type FileImportProps = ast.ImportInput & { key?: Key }

/**
 * Declares an import entry for the enclosing {@link File}.
 *
 * The import is collected by the renderer and emitted at the top of the generated file. A name without a
 * `space` is a value.
 *
 * @example Named import
 * ```tsx
 * <File.Import names={[{ name: 'useState', space: 'value' }]} path="react" />
 * // import { useState } from 'react'
 * ```
 *
 * @example Namespace import
 * ```tsx
 * <File.Import names={[{ name: '*', alias: 'z', space: 'value' }]} path="zod" />
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
