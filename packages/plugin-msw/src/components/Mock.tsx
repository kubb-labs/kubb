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

export function Mock({ name, typeName, url, method }: Props): ReactNode {
  const params = FunctionParams.factory({
    data: {
      type: `${typeName} | ((
        info: Parameters<Parameters<typeof http.${method}>[1]>[0],
      ) => Response)`,
      optional: true,
    },
  })

  return (
    <File.Source name={name} isIndexable isExportable>
      <Function name={name} export params={params.toConstructor()}>
        {`return http.${method}('*${url}', function handler(info) {
    if(typeof data === 'function') return data(info)

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })`}
      </Function>
    </File.Source>
  )
}
