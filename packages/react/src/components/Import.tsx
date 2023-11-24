import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '../types.ts'

type Props = KubbFile.Import & {
  /**
   * When true, it will return the generated import.
   * When false, it will add the import to a KubbFile instance(see fileManager).
   */
  print?: boolean
}

export function Import({ name, root, path, isTypeOnly, print }: Props): KubbNode {
  return <kubb-import name={name} root={root} path={path} isTypeOnly={isTypeOnly} print={print} />
}
