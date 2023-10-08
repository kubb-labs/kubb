import React from 'react'
import type { Import as ImportFileType } from '@kubb/core'

type Props = ImportFileType & {
  print?: boolean
}

export function Import({ name, path, isTypeOnly, print: printImport }: Props): React.ReactNode {
  return <kubb-import name={name} path={path} isTypeOnly={isTypeOnly} print={printImport} />
}
