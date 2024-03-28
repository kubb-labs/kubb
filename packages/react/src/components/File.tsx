import { createContext } from 'react'

import { Export } from './Export.tsx'
import { Import } from './Import.tsx'

import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '../types.ts'

export type FileContextProps<TMeta extends KubbFile.FileMetaBase = KubbFile.FileMetaBase> = {
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

type Props<TMeta extends KubbFile.FileMetaBase = KubbFile.FileMetaBase> = BaseProps & {
  /**
   * Unique identifier to reuse later.
   * @default crypto.randomUUID()
   */
  id?: KubbFile.File['id']
  /**
   * This will override `process.env[key]` inside the `source`, see `getFileSource`.
   */
  env?: KubbFile.File['env']
  /**
   * This will call fileManager.add instead of fileManager.addOrAppend, adding the source when the files already exists.
   * This will also ignore the combinefiles utils
   * @default `false`
   */
  override?: KubbFile.File['override']
  meta?: TMeta
  children?: KubbNode
}

export function File<TMeta extends KubbFile.FileMetaBase = KubbFile.FileMetaBase>({ children, ...rest }: Props<TMeta>): KubbNode {
  if (!rest.baseName || !rest.path) {
    return children
  }

  return (
    <kubb-file {...rest}>
      <FileContext.Provider value={{ baseName: rest.baseName, path: rest.path, meta: rest.meta }}>{children}</FileContext.Provider>
    </kubb-file>
  )
}

type FileSourceUnionProps =
  | {
      /**
       * When path is set it will copy-paste that file as a string inside the component.
       * Children will then be ignored
       */
      path?: string
      children?: never
    }
  | {
      /**
       * When path is set it will copy-paste that file as a string inside the component.
       * Children will then be ignored
       */
      path?: never
      children?: KubbNode
    }

type FileSourceProps = FileSourceUnionProps & {
  /**
   * When true, it will return the generated import.
   * When false, it will add the import to a KubbFile instance(see fileManager).
   */
  print?: boolean
}

function FileSource({ path, print, children }: FileSourceProps): KubbNode {
  return (
    <kubb-source path={path} print={print}>
      {children}
    </kubb-source>
  )
}

File.Export = Export
File.Import = Import
File.Source = FileSource
File.Context = FileContext
