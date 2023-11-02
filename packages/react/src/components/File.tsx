import { Export } from './Export.tsx'
import { Import } from './Import.tsx'

import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '../types.ts'

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
  id?: string
  env?: NodeJS.ProcessEnv
  children?: KubbNode
  override?: boolean
}

export function File(props: Props): KubbNode {
  if (!props.baseName || !props.path) {
    return props.children
  }

  return <kubb-file {...props} />
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
  children?: KubbNode
}

type FileSourceProps = FileSourceUnionProps & {
  print?: boolean
  /**
   * Removes comments
   */
  removeComments?: boolean
  noEmitHelpers?: boolean
}

function FileSource({ path, print, removeComments, children }: FileSourceProps): KubbNode {
  return (
    <kubb-source path={path} print={print} removeComments={removeComments}>
      {children}
    </kubb-source>
  )
}

File.Export = Export
File.Import = Import
File.Source = FileSource
