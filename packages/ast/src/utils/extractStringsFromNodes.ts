import type { CodeNode } from '../nodes/code.ts'

/**
 * Extracts all string content from a `CodeNode` tree recursively.
 *
 * Collects text node values, identifier references in string fields (`params`, `generics`, `returnType`, `type`),
 * and nested node content. Used to build the full source string for import filtering.
 */
export function extractStringsFromNodes(nodes: Array<CodeNode> | undefined): string {
  if (!nodes?.length) return ''

  // Imperative single pass. The earlier `map().filter().join()` allocated a closure plus two
  // intermediate arrays per call, and this runs recursively over every code node during file
  // assembly, so the churn showed up in deopt traces. Appending directly keeps it flat.
  const collected: Array<string> = []

  for (const node of nodes) {
    // Backward-compat: compiled plugins may still pass bare strings at runtime
    if (typeof node === 'string') {
      if (node) collected.push(node as string)
      continue
    }
    if (node.kind === 'Text') {
      if (node.value) collected.push(node.value)
      continue
    }
    if (node.kind === 'Break') continue
    if (node.kind === 'Jsx') {
      if (node.value) collected.push(node.value)
      continue
    }

    const parts: Array<string> = []
    if ('params' in node && node.params) parts.push(node.params)
    if ('generics' in node && node.generics) parts.push(Array.isArray(node.generics) ? node.generics.join(', ') : node.generics)
    if ('returnType' in node && node.returnType) parts.push(node.returnType)
    if ('type' in node && typeof node.type === 'string') parts.push(node.type)

    const nested = extractStringsFromNodes(node.nodes)
    if (nested) parts.push(nested)

    if (parts.length) collected.push(parts.join('\n'))
  }

  return collected.join('\n')
}
