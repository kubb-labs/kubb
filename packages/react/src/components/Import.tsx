import { getRelativePath } from '@kubb/core/utils'

import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '../types.ts'

type Props = KubbFile.Import & {
  print?: boolean
  /**
   * When root is set it will get the path with relative getRelativePath(root, path)
   */
  root?: string
}

export function Import({ name, root, path, isTypeOnly, print: printImport }: Props): KubbNode {
  const importPath = root ? getRelativePath(root, path) : path

  return <kubb-import name={name} path={importPath} isTypeOnly={isTypeOnly} print={printImport} />
}
