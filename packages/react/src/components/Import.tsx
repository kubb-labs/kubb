import type { KubbFile } from '@kubb/core'
import type { ReactNode } from 'react'

type Props = KubbFile.Import & {
  print?: boolean
  /**
   * TODO
   * When root is set it will use getRelativePath(file.path, fileType.path) instead
   */
  root?: string
}

export function Import({ name, path, isTypeOnly, print: printImport }: Props): ReactNode {
  return <kubb-import name={name} path={path} isTypeOnly={isTypeOnly} print={printImport} />
}
