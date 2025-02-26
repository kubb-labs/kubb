import { File, Function, FunctionParams } from '@kubb/react'

import type { HttpMethod } from '@kubb/oas'
import type { ReactNode } from 'react'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  fakerName: string
  url: string
  baseURL: string | undefined
  method: HttpMethod
}

export function Mock({ baseURL = '', name, typeName, url, method }: Props): ReactNode {
  const params = FunctionParams.factory({
    data: {
      type: typeName,
      optional: true,
    },
  })

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={params.toConstructor()} returnType={`Chainable<${typeName}>`}>
        {`return cy.request(${method})`}
      </Function>
    </File.Source>
  )
}
