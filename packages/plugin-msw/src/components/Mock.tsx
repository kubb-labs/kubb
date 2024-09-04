import { URLPath } from '@kubb/core/utils'
import { File } from '@kubb/react'

import type { Operation } from '@kubb/oas'
import type { ReactNode } from 'react'

type Props = {
  /**
   * Name of the function
   */
  name: string
  operation: Operation
  // custom
  responseName: string
}

export function Mock({ name, responseName, operation }: Props): ReactNode {
  const path = new URLPath(operation.path)

  return (
    <File.Source name={name} isIndexable isExportable>
      {`
  export const ${name} = http.${operation.method}('*${path.toURLPath()}', function handler(info) {
    return new Response(JSON.stringify(${responseName}()), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
  `}
    </File.Source>
  )
}
