import type { KubbFile } from '@kubb/core'
import type { KubbNode } from '../types.ts'

type Props = KubbFile.Export & {
  print?: boolean
}

export function Export({ name, path, isTypeOnly, asAlias, print: printExport }: Props): KubbNode {
  return <kubb-export name={name} path={path} isTypeOnly={isTypeOnly} asAlias={asAlias} print={printExport} />
}
