import { nodeKinds } from '../constants.ts'
import type { NodeKind } from '../nodes/base.ts'
import type { CodeNode } from '../nodes/code.ts'

/**
 * What a piece of node text holds, so a language can read a fragment such as a type or a parameter list as one.
 */
export type InlineTextKind = 'code' | 'type' | 'value' | 'parameters' | 'typeParameters'

// The string fields of each node kind and what they hold. `inherit` is the kind of the text around the node.
const CODE_NODE_TEXT_FIELDS: Partial<Record<NodeKind, Readonly<Record<string, InlineTextKind | 'inherit'>>>> = {
  Text: { value: 'inherit' },
  Jsx: { value: 'inherit' },
  Function: { params: 'parameters', generics: 'typeParameters', returnType: 'type' },
  ArrowFunction: { params: 'parameters', generics: 'typeParameters', returnType: 'type' },
  Const: { type: 'type' },
}

// What the nested `nodes` of a node hold: a type's body, a constant's value, or code.
const NESTED_KIND: Partial<Record<NodeKind, InlineTextKind>> = { Type: 'type', Const: 'value', Function: 'code', ArrowFunction: 'code' }

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
    for (const field of Object.keys(CODE_NODE_TEXT_FIELDS[node.kind] ?? {})) {
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

// Rewrites the string fields `getNodeText` reads, passing what each one holds; JSDoc stays as written.
export function rewriteNodes(
  nodes: Array<CodeNode> | undefined,
  rewrite: (text: string, kind: InlineTextKind) => string,
  kind: InlineTextKind = 'code',
): Array<CodeNode> | undefined {
  return nodes?.map((node): CodeNode => {
    // Backward-compat: compiled plugins may still pass bare strings at runtime
    if (typeof node === 'string') return rewrite(node, kind) as unknown as CodeNode
    if (node.kind === nodeKinds.break) return node

    const next = { ...node } as unknown as Record<string, unknown>
    for (const [field, fieldKind] of Object.entries(CODE_NODE_TEXT_FIELDS[node.kind] ?? {})) {
      next[field] = rewriteField(next[field], (text) => rewrite(text, fieldKind === 'inherit' ? kind : fieldKind))
    }
    if ('nodes' in node && node.nodes) next.nodes = rewriteNodes(node.nodes, rewrite, NESTED_KIND[node.kind] ?? kind)
    return next as unknown as CodeNode
  })
}

function rewriteField(value: unknown, rewrite: (text: string) => string): unknown {
  if (Array.isArray(value)) return value.map(rewrite)
  return typeof value === 'string' && value ? rewrite(value) : value
}
