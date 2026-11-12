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
 * Pushes every string `getNodeText` reads from `nodes` into `into`, without joining them. An array field
 * pushes each item, so the result matches `getNodeText` for any search term without `\n` or `, `.
 */
export function collectNodeStrings(nodes: Array<CodeNode> | undefined, into: Array<string>): Array<string> {
  for (const node of nodes ?? []) {
    if (typeof node === 'string') {
      if (node) into.push(node as string)
      continue
    }
    const record = node as unknown as Record<string, unknown>
    for (const field of CODE_NODE_TEXT_FIELDS[node.kind] ?? []) {
      const value = record[field]
      if (Array.isArray(value)) into.push(...value.filter(Boolean))
      if (typeof value === 'string' && value) into.push(value)
    }
    if ('nodes' in node) collectNodeStrings(node.nodes, into)
  }
  return into
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
