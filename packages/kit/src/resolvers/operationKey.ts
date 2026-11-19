import type { OperationNode } from '@kubb/ast'

/** The `resolveName` key for a declaration an operation owns; it starts from the `pointer` macros keep. */
export function operationKey(node: OperationNode, ...scope: Array<string | number>): Array<string | undefined> {
  const source = node.pointer ? [node.pointer] : [node.method, node.path]
  return ['operation', ...source, ...scope.map(String)]
}
