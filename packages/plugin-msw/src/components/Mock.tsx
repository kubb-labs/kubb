import { File } from '@kubb/react'

import type { HttpMethod } from '@kubb/oas'
import type { ReactNode } from 'react'

type Props = {
  /**
   * Name of the function
   */
  name: string
  fakerName: string
  url: string
  method: HttpMethod
}

export function Mock({ name, fakerName, url, method }: Props): ReactNode {
  return (
    <File.Source name={name} isIndexable isExportable>
      {`
  export const ${name} = http.${method}('*${url}', function handler(info) {
    return new Response(JSON.stringify(${fakerName}()), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
  `}
    </File.Source>
  )
}
