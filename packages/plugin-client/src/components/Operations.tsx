import { URLPath } from '@kubb/core/utils'
import { Const, File } from '@kubb/react'

import type { HttpMethod, Operation } from '@kubb/oas'

type OperationsProps = {
  name: string
  operations: Array<Operation>
}

export function Operations({ name, operations }: OperationsProps) {
  const operationsObject: Record<string, { path: string; method: HttpMethod }> = {}

  operations.forEach((operation) => {
    operationsObject[operation.getOperationId()] = {
      path: new URLPath(operation.path).URL,
      method: operation.method,
    }
  })

  return (
    <File.Source name={name} isExportable isIndexable>
      <Const name={name} export asConst>
        {JSON.stringify(operationsObject, undefined, 2)}
      </Const>
    </File.Source>
  )
}
