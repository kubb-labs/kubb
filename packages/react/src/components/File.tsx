import { Export } from './Export.tsx'
import { Import } from './Import.tsx'
import { Text } from './Text.tsx'

import type { ReactNode } from 'react'

type BaseProps =
  | {
      fileName?: never
      path?: never
    }
  | {
      fileName: string
      path: string
    }

type Props = BaseProps & {
  env?: NodeJS.ProcessEnv
  children?: ReactNode
}

export function File({ fileName, path, env, children }: Props): ReactNode {
  if (!fileName || !path) {
    return children
  }

  return (
    <kubb-file fileName={fileName} path={path} env={env}>
      {children}
    </kubb-file>
  )
}

function FileSource({ children }: { children?: ReactNode }): ReactNode {
  return children
}

File.Export = Export
File.Import = Import
File.Source = FileSource
