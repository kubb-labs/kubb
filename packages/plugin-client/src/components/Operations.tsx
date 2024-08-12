import { URLPath } from '@kubb/core/utils'
import { Const } from '@kubb/react'

import type { HttpMethod, Operation } from '@kubb/oas'

type OperationsProps = {
  operations: Array<Operation>
}

export function Operations({ operations }: OperationsProps) {
  const operationsObject: Record<string, { path: string; method: HttpMethod }> = {}

  operations.forEach((operation) => {
    operationsObject[operation.getOperationId()] = {
      path: new URLPath(operation.path).URL,
      method: operation.method,
    }
  })

  return (
    <Const name={'operations'} export asConst>
      {JSON.stringify(operationsObject, undefined, 2)}
    </Const>
  )
}
