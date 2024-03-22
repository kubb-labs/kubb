import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '../types.ts'

type Props = KubbFile.Import & {
  /**
   * When true, it will return the generated import.
   * When false, it will add the import to a KubbFile instance(see fileManager).
   */
  print?: boolean
}

export function Import({ name, root, path, isTypeOnly, isNameSpace, print }: Props): KubbNode {
  return <kubb-import name={name} root={root} path={path} isNameSpace={isNameSpace} isTypeOnly={isTypeOnly} print={print} />
}
