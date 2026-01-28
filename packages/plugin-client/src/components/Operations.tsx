import { URLPath } from '@kubb/core/utils'
import type { HttpMethod, Operation } from '@kubb/oas'
import { Const, File } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'

type OperationsProps = {
  name: string
  operations: Array<Operation>
}

export function Operations({ name, operations }: OperationsProps): FabricReactNode {
  const operationsObject: Record<string, { path: string; method: HttpMethod }> = {}

  operations.forEach((operation) => {
    operationsObject[operation.getOperationId()] = {
      path: new URLPath(operation.path).URL,
      method: operation.method,
    }
  })

  return (
    <File.Source name={name} isExportable isIndexable>
      <Const name={name} export>
        {JSON.stringify(operationsObject, undefined, 2)}
      </Const>
    </File.Source>
  )
}
