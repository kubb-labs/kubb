import { nodeKinds } from '../constants.ts'
import type { NodeKind } from '../nodes/base.ts'
import type { CodeNode } from '../nodes/code.ts'

export const CODE_NODE_TEXT_FIELDS: Partial<Record<NodeKind, ReadonlyArray<string>>> = {
  Text: ['value'],
  Jsx: ['value'],
  Function: ['params', 'generics', 'returnType'],
  ArrowFunction: ['params', 'generics', 'returnType'],
  Const: ['type'],
}

/**
 * Extracts all string content from a `CodeNode` tree recursively.
 *
 * Collects the text fields and nested node content, to build the source string for import filtering.
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
    if (node.kind === nodeKinds.break) continue

    const parts: Array<string> = []
    const record = node as unknown as Record<string, unknown>
    for (const field of CODE_NODE_TEXT_FIELDS[node.kind] ?? []) {
      const value = record[field]
      if (Array.isArray(value)) parts.push(value.join(', '))
      if (typeof value === 'string' && value) parts.push(value)
    }

    const nested = 'nodes' in node ? extractStringsFromNodes(node.nodes) : ''
    if (nested) parts.push(nested)

    if (parts.length) collected.push(parts.join('\n'))
  }

  return collected.join('\n')
}
