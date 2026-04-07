import type { ExportNode, ImportNode, SourceNode } from '@kubb/ast/types'
import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

type BasePropsWithBaseName = {
  /**
   * Name to be used to dynamically create the baseName(based on input.path).
   * Based on UNIX basename
   * @link https://nodejs.org/api/path.html#pathbasenamepath-suffix
   */
  baseName: `${string}.${string}`
  /**
   * Path will be full qualified path to a specified file.
   */
  path: string
}

type BasePropsWithoutBaseName = {
  baseName?: never
  /**
   * Path will be full qualified path to a specified file.
   */
  path?: string
}

type BaseProps = BasePropsWithBaseName | BasePropsWithoutBaseName

type Props<TMeta> = BaseProps & {
  key?: Key
  meta?: TMeta
  banner?: string
  footer?: string
  children?: KubbReactNode
}

/**
 * Adds files to the FileManager
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
  children?: KubbReactNode
}

/**
 * File.Source
 *
 * Marks a block of source text to be associated with the current file when
 * rendering with the FileCollector. Children are treated as the source string.
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

export type FileExportProps = Omit<ExportNode, 'kind'> & { key?: Key }

/**
 * File.Export
 *
 * Declares an export entry for the current file. This will be collected by
 * the FileCollector for later emission.
 */
function FileExport(props: FileExportProps): KubbReactElement {
  const { name, path, isTypeOnly, asAlias } = props

  return <kubb-export name={name} path={path} isTypeOnly={isTypeOnly} asAlias={asAlias} />
}

FileExport.displayName = 'FileExport'

export type FileImportProps = Omit<ImportNode, 'kind'> & { key?: Key }

/**
 * File.Import
 *
 * Declares an import entry for the current file.
 */
function FileImport(props: FileImportProps): KubbReactElement {
  const { name, root, path, isTypeOnly, isNameSpace } = props

  return <kubb-import name={name} root={root} path={path} isNameSpace={isNameSpace} isTypeOnly={isTypeOnly} />
}

FileImport.displayName = 'FileImport'

File.Export = FileExport
File.Import = FileImport
File.Source = FileSource
