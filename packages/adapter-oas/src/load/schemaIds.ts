import { escapePointerToken } from '@internals/utils'

type Visit = (node: Record<string, unknown>, pointer: string) => void

function walk(node: unknown, pointer: string, visit: Visit): void {
  if (!node || typeof node !== 'object') return
  if (!Array.isArray(node)) visit(node as Record<string, unknown>, pointer)
  for (const [key, value] of Object.entries(node)) walk(value, `${pointer}/${escapePointerToken(key)}`, visit)
}

/**
 * Rewrites, in place, each `$ref` that names a schema by its `$id`, `$anchor` or `$dynamicAnchor`, and each
 * `$dynamicRef`, into a `#/...` JSON pointer, so they resolve like any local `$ref` and are not fetched.
 *
 * shortcut: `$id` matches the `$ref` string exactly and `$dynamicRef` resolves statically to its anchor,
 * so a relative `$id` base or a recursively extended schema is not followed, upgrade when a spec needs that.
 */
export function resolveSchemaIds(document: unknown): void {
  const targets = new Map<string, string>()
  walk(document, '#', (node, pointer) => {
    if (typeof node['$id'] === 'string') targets.set(node['$id'], pointer)
    for (const key of ['$anchor', '$dynamicAnchor']) {
      if (typeof node[key] === 'string') targets.set(`#${node[key]}`, pointer)
    }
  })
  if (!targets.size) return

  walk(document, '#', (node) => {
    const ref = typeof node['$ref'] === 'string' ? targets.get(node['$ref']) : undefined
    if (ref) node['$ref'] = ref
    const dynamicRef = typeof node['$dynamicRef'] === 'string' ? targets.get(node['$dynamicRef']) : undefined
    if (dynamicRef && node['$ref'] === undefined) {
      node['$ref'] = dynamicRef
      delete node['$dynamicRef']
    }
  })
}
