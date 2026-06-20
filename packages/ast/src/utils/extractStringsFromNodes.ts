import type { CodeNode } from '../nodes/code.ts'
import type { ExpressionNode } from '../nodes/expression.ts'
import { isExpressionNode } from '../nodes/expression.ts'

/**
 * Collects the identifier references an expression carries, so import filtering sees the symbols
 * it uses. Property keys, member names, literals, and arrow parameters are local and contribute
 * nothing.
 */
function extractStringsFromExpression(node: ExpressionNode): string {
  switch (node.kind) {
    case 'Identifier':
      return node.name
    case 'Member':
      return extractStringsFromExpression(node.object)
    case 'Call':
      return [extractStringsFromExpression(node.callee), ...node.args.map(extractStringsFromExpression), ...(node.typeArgs ?? [])].filter(Boolean).join('\n')
    case 'ObjectExpression':
      return node.properties
        .map((entry) => (entry.type === 'spread' ? extractStringsFromExpression(entry.expression) : extractStringsFromExpression(entry.value)))
        .filter(Boolean)
        .join('\n')
    case 'ArrayExpression':
      return node.elements.map(extractStringsFromExpression).filter(Boolean).join('\n')
    case 'Arrow':
      return extractStringsFromExpression(node.body)
    case 'Spread':
      return extractStringsFromExpression(node.expression)
    case 'As':
      return [extractStringsFromExpression(node.expression), node.type].filter(Boolean).join('\n')
    case 'RawExpression':
      return node.value
    default:
      return ''
  }
}

/**
 * Extracts all string content from a `CodeNode` tree recursively.
 *
 * Collects text node values, identifier references in string fields (`params`, `generics`, `returnType`, `type`)
 * and expression nodes, and nested node content. Used to build the full source string for import filtering.
 */
export function extractStringsFromNodes(nodes: Array<CodeNode> | undefined): string {
  if (!nodes?.length) return ''

  return nodes
    .map((node) => {
      // Backward-compat: compiled plugins may still pass bare strings at runtime
      if (typeof node === 'string') return node as string
      if (node.kind === 'Text') return node.value
      if (node.kind === 'Break') return ''
      if (node.kind === 'Jsx') return node.value
      if (isExpressionNode(node)) return extractStringsFromExpression(node)

      const parts: Array<string> = []

      if ('params' in node && node.params) parts.push(node.params)
      if ('generics' in node && node.generics) parts.push(Array.isArray(node.generics) ? node.generics.join(', ') : node.generics)
      if ('returnType' in node && node.returnType) parts.push(node.returnType)
      if ('type' in node && typeof node.type === 'string') parts.push(node.type)

      const nested = extractStringsFromNodes(node.nodes)

      if (nested) parts.push(nested)

      return parts.join('\n')
    })
    .filter(Boolean)
    .join('\n')
}
