import { URLPath } from '@internals/utils'
import type { OperationNode } from '@kubb/ast/types'
import { Const, File } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'

type OperationsProps = {
  name: string
  nodes: Array<OperationNode>
}

export function Operations({ name, nodes }: OperationsProps): FabricReactNode {
  const operationsObject: Record<string, { path: string; method: string }> = {}

  nodes.forEach((node) => {
    operationsObject[node.operationId] = {
      path: new URLPath(node.path).URL,
      method: node.method.toLowerCase(),
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
