import { Export } from './Export.tsx'
import { Import } from './Import.tsx'

import type { KubbFile } from '@kubb/core'
import type { ReactNode } from 'react'

type BaseProps =
  | {
      baseName?: never
      path?: KubbFile.Path
    }
  | {
      baseName: KubbFile.BaseName
      path: KubbFile.Path
    }

type Props = BaseProps & {
  env?: NodeJS.ProcessEnv
  children?: ReactNode
}

export function File({ baseName, path, env, children }: Props): ReactNode {
  if (!baseName || !path) {
    return children
  }

  return (
    <kubb-file baseName={baseName} path={path} env={env}>
      {children}
    </kubb-file>
  )
}

type FileSourceProps = {
  print?: boolean
  path?: string
  children?: ReactNode
}

function FileSource({ path, print, children }: FileSourceProps): ReactNode {
  return (
    <kubb-source path={path} print={print}>
      {children}
    </kubb-source>
  )
}

File.Export = Export
File.Import = Import
File.Source = FileSource
