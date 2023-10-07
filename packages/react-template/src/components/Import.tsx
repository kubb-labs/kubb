import React from 'react'
import type { ReactNode } from 'react'
import { Text } from './Text.tsx'
import { createImportDeclaration, print } from '@kubb/ts-codegen'

type Props = Parameters<typeof createImportDeclaration>[0] & {
  children?: ReactNode
  print?: boolean
}

export function Import({ name, path, isTypeOnly, print: printImport, children }: Props): React.ReactNode {
  // TODO move out export and use the renderer
  const importText = print(createImportDeclaration({ name, path, isTypeOnly }))

  return (
    <>
      <kubb-import name={name} path={path} isTypeOnly={isTypeOnly} print={printImport}>
        <Text>{importText}</Text>
      </kubb-import>
      {printImport && (
        <>
          <Text>{importText}</Text>
          <Text>{children}</Text>
        </>
      )}
    </>
  )
}
