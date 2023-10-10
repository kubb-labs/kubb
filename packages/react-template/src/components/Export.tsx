import type { Export as ExportFileType } from '@kubb/core'
import type { ReactNode } from 'react'

type Props = ExportFileType & {
  print?: boolean
}

export function Export({ name, path, isTypeOnly, asAlias, print: printExport }: Props): ReactNode {
  return <kubb-export name={name} path={path} isTypeOnly={isTypeOnly} asAlias={asAlias} print={printExport} />
}
