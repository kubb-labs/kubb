import type { OperationNode } from '@kubb/ast'

/**
 * Builds the `resolveName` key for a declaration an operation owns. `scope` names which declaration
 * it is, so two of them never share a name even when a custom resolver gives both the same name.
 * Leave `scope` empty for the operation's own declaration.
 *
 * The key starts from the operation's input `pointer`, which macros keep, so a plugin whose macro
 * rewrites the method or path still resolves another plugin's names for the same operation.
 *
 * @example
 * ```ts
 * resolver.resolveName({ key: operationKey(node, 'response', 'status', 404), name })
 * ```
 */
export function operationKey(node: OperationNode, ...scope: Array<string | number>): Array<string | undefined> {
  const source = node.pointer ? [node.pointer] : [node.method, node.path]
  return ['operation', ...source, ...scope.map(String)]
}
