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
  method: HttpMethod
}

export function MockWithFaker({ name, fakerName, typeName, url, method }: Props): ReactNode {
  const params = FunctionParams.factory({
    data: {
      type: typeName,
      optional: true,
    },
  })

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={params.toConstructor()}>
        {`return http.${method}('*${url}', function handler(info) {
    return new Response(JSON.stringify(${fakerName}(data)), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })`}
      </Function>
    </File.Source>
  )
}
