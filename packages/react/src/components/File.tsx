import { Export } from './Export.tsx'
import { Import } from './Import.tsx'

import type { KubbFile } from '@kubb/core'
import type { ReactNode } from 'react'

type BasePropsWithBaseName = {
  baseName: KubbFile.BaseName
  path: KubbFile.Path
}

type BasePropsWithoutBaseName = {
  baseName?: never
  path?: KubbFile.Path
}

type BaseProps = BasePropsWithBaseName | BasePropsWithoutBaseName

type Props = BaseProps & {
  env?: NodeJS.ProcessEnv
  children?: ReactNode
  override?:boolean
}

export function File({ baseName, path, env, override,children }: Props): ReactNode {
  if (!baseName || !path) {
    return children
  }

  return (
    <kubb-file baseName={baseName} path={path} env={env} override={override}>
      {children}
    </kubb-file>
  )
}

type FileSourceUnionProps = {
  /**
   * When path is set it will copy-paste that file as a string inside the component
   * Children will then be ignored
   */
  path?: string
  children?: never
} | {
  /**
   * When path is set it will copy-paste that file as a string inside the component
   * Children will then be ignored
   */
  path?: never
  children?: ReactNode
}

type FileSourceProps = FileSourceUnionProps & {
  print?: boolean
  /**
   * Removes comments
   */
  removeComments?: boolean
  noEmitHelpers?: boolean
}

function FileSource({ path, print, removeComments, children }: FileSourceProps): ReactNode {
  return (
    <kubb-source path={path} print={print} removeComments={removeComments}>
      {children}
    </kubb-source>
  )
}

File.Export = Export
File.Import = Import
File.Source = FileSource
