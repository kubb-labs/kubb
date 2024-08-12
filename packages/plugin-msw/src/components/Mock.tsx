import type { URLPath } from '@kubb/core/utils'

import type { HttpMethod } from '@kubb/oas'
import type { ReactNode } from 'react'

type MockProps = {
  /**
   * Name of the function
   */
  name: string
  /**
   * Method of the current operation, see useOperation.
   */
  method: HttpMethod
  /**
   * Path of the mock
   */
  path: URLPath
  /**
   * Name of the import for the mock(this is a function).
   * @example createPet
   */
  responseName: string
}

export function Mock({ name, method, path, responseName }: MockProps): ReactNode {
  return (
    <>
      {`
  export const ${name} = http.${method}('*${path.toURLPath()}', function handler(info) {
    return new Response(JSON.stringify(${responseName}()), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
  `}
    </>
  )
}
