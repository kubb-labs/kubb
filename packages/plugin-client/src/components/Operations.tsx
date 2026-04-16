import { URLPath } from '@internals/utils'
import type { ast } from '@kubb/core'
import { Const, File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'

type OperationsProps = {
  name: string
  nodes: Array<ast.OperationNode>
}

export function Operations({ name, nodes }: OperationsProps): KubbReactNode {
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
