import { createContext } from 'react'

import type { FileMetaBase } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'
import type { KubbNode } from '../types.ts'

export type FileContextProps<TMeta extends FileMetaBase = FileMetaBase> = {
  /**
   * Name to be used to dynamicly create the baseName(based on input.path).
   * Based on UNIX basename
   * @link https://nodejs.org/api/path.html#pathbasenamepath-suffix
   */
  baseName: KubbFile.BaseName
  /**
   * Path will be full qualified path to a specified file.
   */
  path: KubbFile.Path
  meta?: TMeta
}
const FileContext = createContext<FileContextProps>({} as FileContextProps)

type BasePropsWithBaseName = {
  /**
   * Name to be used to dynamicly create the baseName(based on input.path).
   * Based on UNIX basename
   * @link https://nodejs.org/api/path.html#pathbasenamepath-suffix
   */
  baseName: KubbFile.BaseName
  /**
   * Path will be full qualified path to a specified file.
   */
  path: KubbFile.Path
}

type BasePropsWithoutBaseName = {
  baseName?: never
  /**
   * Path will be full qualified path to a specified file.
   */
  path?: KubbFile.Path
}

type BaseProps = BasePropsWithBaseName | BasePropsWithoutBaseName

type Props<TMeta extends FileMetaBase = FileMetaBase> = BaseProps & {
  /**
   * Unique identifier to reuse later.
   * @default crypto.randomUUID()
   */
  id?: KubbFile.File['id']
  /**
   * This will call fileManager.add instead of fileManager.addOrAppend, adding the source when the files already exists.
   * This will also ignore the combinefiles utils
   * @default `false`
   */
  override?: KubbFile.File['override']
  meta?: TMeta
  children?: KubbNode
}

export function File<TMeta extends FileMetaBase = FileMetaBase>({ children, ...rest }: Props<TMeta>): KubbNode {
  if (!rest.baseName || !rest.path) {
    return children
  }

  return (
    <kubb-file {...rest}>
      <FileContext.Provider value={{ baseName: rest.baseName, path: rest.path, meta: rest.meta }}>{children}</FileContext.Provider>
    </kubb-file>
  )
}

type FileSourceProps = Omit<KubbFile.Source, 'value'> & {
  children?: KubbNode
}

function FileSource({ isTypeOnly, name, isExportable, children }: FileSourceProps): KubbNode {
  return (
    <kubb-source name={name} isTypeOnly={isTypeOnly} isExportable={isExportable}>
      {children}
    </kubb-source>
  )
}

type FileExportProps = KubbFile.Export

function FileExport({ name, path, isTypeOnly, asAlias }: FileExportProps): KubbNode {
  return <kubb-export name={name} path={path} isTypeOnly={isTypeOnly || false} asAlias={asAlias} />
}

type FileImportProps = KubbFile.Import

export function FileImport({ name, root, path, isTypeOnly, isNameSpace }: FileImportProps): KubbNode {
  return <kubb-import name={name} root={root} path={path} isNameSpace={isNameSpace} isTypeOnly={isTypeOnly || false} />
}

File.Export = FileExport
File.Import = FileImport
File.Source = FileSource
File.Context = FileContext
