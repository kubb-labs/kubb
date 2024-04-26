import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '../types.ts'

type Props = KubbFile.Export & {
  /**
   * When true, it will return the generated import.
   * When false, it will add the import to a KubbFile instance(see fileManager)
   */
  print?: boolean
}

export function Export({ name, path, isTypeOnly, asAlias, print }: Props): KubbNode {
  return <kubb-export name={name} path={path} isTypeOnly={isTypeOnly || false} asAlias={asAlias} print={print} />
}
