import { nodeKinds } from '../constants.ts'
import type { NodeKind } from '../nodes/base.ts'
import type { CodeNode } from '../nodes/code.ts'

const CODE_NODE_TEXT_FIELDS: Partial<Record<NodeKind, ReadonlyArray<string>>> = {
  Text: ['value'],
  Jsx: ['value'],
  Function: ['params', 'generics', 'returnType'],
  ArrowFunction: ['params', 'generics', 'returnType'],
  Const: ['type'],
}

/**
 * Extracts all string content from a `CodeNode` tree recursively.
 * Collects the text fields and nested node content, to build the source string for import filtering.
 */
export function getNodeText(nodes: Array<CodeNode> | undefined): string {
  if (!nodes?.length) return ''

  // One flat pass: this runs over every code node during file assembly, so it skips `map().filter().join()` allocations.
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

    const nested = 'nodes' in node ? getNodeText(node.nodes) : ''
    if (nested) parts.push(nested)

    if (parts.length) collected.push(parts.join('\n'))
  }

  return collected.join('\n')
}

// Rewrites the string fields `getNodeText` reads; JSDoc stays as written.
export function rewriteNodes(nodes: Array<CodeNode> | undefined, rewrite: (text: string) => string): Array<CodeNode> | undefined {
  return nodes?.map((node): CodeNode => {
    // Backward-compat: compiled plugins may still pass bare strings at runtime
    if (typeof node === 'string') return rewrite(node) as unknown as CodeNode
    if (node.kind === nodeKinds.break) return node

    const next = { ...node } as unknown as Record<string, unknown>
    for (const field of CODE_NODE_TEXT_FIELDS[node.kind] ?? []) next[field] = rewriteField(next[field], rewrite)
    if ('nodes' in node && node.nodes) next.nodes = rewriteNodes(node.nodes, rewrite)
    return next as unknown as CodeNode
  })
}

function rewriteField(value: unknown, rewrite: (text: string) => string): unknown {
  if (Array.isArray(value)) return value.map(rewrite)
  return typeof value === 'string' && value ? rewrite(value) : value
}
