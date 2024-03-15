import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '../types.ts'

type Props = KubbFile.Export & {
  key?: React.Key
  /**
   * When true, it will return the generated import.
   * When false, it will add the import to a KubbFile instance(see fileManager)
   */
  print?: boolean
}

export function Export({ key, name, path, isTypeOnly, asAlias, print }: Props): KubbNode {
  return <kubb-export key={key} name={name} path={path} isTypeOnly={isTypeOnly} asAlias={asAlias} print={print} />
}
