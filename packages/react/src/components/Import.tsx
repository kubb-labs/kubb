import type { Import as ImportFileType } from '@kubb/core'
import type { ReactNode } from 'react'

type Props = ImportFileType & {
  print?: boolean
}

export function Import({ name, path, isTypeOnly, print: printImport }: Props): ReactNode {
  return <kubb-import name={name} path={path} isTypeOnly={isTypeOnly} print={printImport} />
}
