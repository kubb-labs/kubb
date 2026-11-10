import { escapePointerToken } from '@internals/utils'

type Visit = (node: Record<string, unknown>, pointer: string) => void

// Keys that hold instance data, not schemas. Their values can contain `$ref` or `$id` strings that are not references.
const DATA_KEYS = new Set(['example', 'examples', 'const', 'enum', 'default'])
// Keys whose children are named entries, so a child called `example` or `x-…` is still a schema.
const NAMED_ENTRY_KEYS = new Set(['properties', 'patternProperties', '$defs', 'definitions', 'schemas', 'dependentSchemas'])

function walk(node: unknown, pointer: string, visit: Visit, parentKey?: string): void {
  if (!node || typeof node !== 'object') return
  if (!Array.isArray(node)) visit(node as Record<string, unknown>, pointer)
  const named = parentKey !== undefined && NAMED_ENTRY_KEYS.has(parentKey)
  for (const [key, value] of Object.entries(node)) {
    if (!named && (DATA_KEYS.has(key) || key.startsWith('x-'))) continue
    walk(value, `${pointer}/${escapePointerToken(key)}`, visit, Array.isArray(node) ? parentKey : key)
  }
}

/**
 * The target for `ref` seen at `pointer`: the declaration in the nearest enclosing schema, as for a
 * `$dynamicRef` to a generic's own `$dynamicAnchor`, else the only declaration. `undefined` when the name is
 * declared more than once and none encloses the ref.
 */
function pick(declarations: Array<string> | undefined, pointer: string): string | undefined {
  if (!declarations) return undefined
  const enclosing = declarations.filter((target) => pointer === target || pointer.startsWith(`${target}/`))
  if (enclosing.length) return enclosing.reduce((a, b) => (b.length > a.length ? b : a))
  return declarations.length === 1 ? declarations[0] : undefined
}

/**
 * Rewrites, in place, each `$ref` that names a schema by its `$id`, `$anchor` or `$dynamicAnchor`, and each
 * `$dynamicRef`, into a `#/...` JSON pointer, so they resolve like any local `$ref` and are not fetched.
 * Example values, `const`, `enum`, `default` and `x-` extensions are left as written.
 *
 * shortcut: `$id` matches the `$ref` string exactly and `$dynamicRef` resolves statically to the nearest
 * enclosing anchor, so a relative `$id` base or a recursively extended schema is not followed, upgrade when a spec needs that.
 */
export function resolveSchemaIds(document: unknown): void {
  const targets = new Map<string, Array<string>>()
  const declare = (key: string, pointer: string) => targets.set(key, [...(targets.get(key) ?? []), pointer])
  walk(document, '#', (node, pointer) => {
    if (typeof node['$id'] === 'string') declare(node['$id'], pointer)
    for (const key of ['$anchor', '$dynamicAnchor']) {
      if (typeof node[key] === 'string') declare(`#${node[key]}`, pointer)
    }
  })
  if (!targets.size) return

  walk(document, '#', (node, pointer) => {
    const ref = typeof node['$ref'] === 'string' ? pick(targets.get(node['$ref']), pointer) : undefined
    if (ref) node['$ref'] = ref
    const dynamicRef = typeof node['$dynamicRef'] === 'string' ? pick(targets.get(node['$dynamicRef']), pointer) : undefined
    if (dynamicRef && node['$ref'] === undefined) {
      node['$ref'] = dynamicRef
      delete node['$dynamicRef']
    }
  })
}
