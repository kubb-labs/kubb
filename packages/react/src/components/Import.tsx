import { getRelativePath } from '@kubb/core/utils'

import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '../types.ts'

type Props = KubbFile.Import & {
  /**
   * When true, it will return the generated import.
   * When false, it will add the import to a KubbFile instance(see fileManager)
   */
  print?: boolean
  /**
   * When root is set it will get the path with relative getRelativePath(root, path)
   */
  root?: string
}

export function Import({ name, root, path, isTypeOnly, print }: Props): KubbNode {
  const resolvedPath = root ? getRelativePath(root, path) : path

  return <kubb-import name={name} path={resolvedPath} isTypeOnly={isTypeOnly} print={print} />
}
