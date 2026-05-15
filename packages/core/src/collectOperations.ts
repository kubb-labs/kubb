import type { OperationNode } from '@kubb/ast'

export async function collectOperations(nodes: AsyncIterable<OperationNode> | Array<OperationNode>): Promise<OperationNode[]> {
  if (Array.isArray(nodes)) return nodes
  const result: OperationNode[] = []
  for await (const node of nodes) result.push(node)
  return result
}
