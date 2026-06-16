import type { CodeNode } from '../nodes/code.ts'

/**
 * Extracts all string content from a `CodeNode` tree recursively.
 *
 * Collects text node values, identifier references in string fields (`params`, `generics`, `returnType`, `type`),
 * and nested node content. Used to build the full source string for import filtering.
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
