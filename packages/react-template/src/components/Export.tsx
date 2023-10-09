import React from 'react'

import type { Export as ExportFileType } from '@kubb/core'

type Props = ExportFileType & {
  print?: boolean
}

export function Export({ name, path, isTypeOnly, asAlias, print: printExport }: Props): React.ReactNode {
  return <kubb-export name={name} path={path} isTypeOnly={isTypeOnly} asAlias={asAlias} print={printExport} />
}
