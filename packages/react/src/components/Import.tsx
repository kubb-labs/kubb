import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '../types.ts'

type Props = KubbFile.Import & {
  print?: boolean
  /**
   * TODO
   * When root is set it will use getRelativePath(file.path, fileType.path) instead
   */
  root?: string
}

export function Import({ name, path, isTypeOnly, print: printImport }: Props): KubbNode {
  return <kubb-import name={name} path={path} isTypeOnly={isTypeOnly} print={printImport} />
}
