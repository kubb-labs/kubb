import React from 'react'
import type { ReactNode } from 'react'
import { Text } from './Text.tsx'
import { createExportDeclaration, print } from '@kubb/ts-codegen'

type Props = Parameters<typeof createExportDeclaration>[0] & {
  children?: ReactNode
  print?: boolean
}

export function Export({ name, path, isTypeOnly, asAlias, print: printExport, children }: Props): React.ReactNode {
  // TODO move out export and use the renderer
  const exportText = print(createExportDeclaration({ name, path, isTypeOnly, asAlias }))

  return (
    <>
      <kubb-export name={name} path={path} isTypeOnly={isTypeOnly} asAlias={asAlias} print={printExport}>
        <Text>{exportText}</Text>
      </kubb-export>
      {printExport && (
        <>
          <Text>{exportText}</Text>
          <Text>{children}</Text>
        </>
      )}
    </>
  )
}
