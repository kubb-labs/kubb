import { File, Function, FunctionParams } from '@kubb/react'

import type { HttpMethod } from '@kubb/oas'
import type { ReactNode } from 'react'
import { URLPath } from '@kubb/core/utils'

type Props = {
  /**
   * Name of the function
   */
  name: string
  typeName: string
  fakerName: string
  baseURL: string | undefined
  url: string
  method: HttpMethod
}

export function MockWithFaker({ baseURL = '', name, fakerName, typeName, url, method }: Props): ReactNode {
  const params = FunctionParams.factory({
    data: {
      type: typeName,
      optional: true,
    },
  })

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={params.toConstructor()} returnType={`Chainable<${typeName}>`}>
        {`return cy.request('${method}', '${new URLPath(`${baseURL ?? ''}${url}`).toURLPath()}', data || undefined)`}
      </Function>
    </File.Source>
  )
}
