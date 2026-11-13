import { escapePointerToken, memo } from '@internals/utils'

const DATA_KEYS = new Set(['example', 'examples', 'const', 'enum', 'default'])
const NAMED_ENTRY_KEYS = new Set(['properties', 'patternProperties', '$defs', 'definitions', 'schemas', 'dependentSchemas'])
const TARGET_KEYS = ['$id', '$anchor', '$dynamicAnchor'] as const

function walk(node: unknown, pointer: string, visit: (node: Record<string, unknown>, pointer: string) => void, parentKey?: string): void {
  if (!node || typeof node !== 'object') return
  if (!Array.isArray(node)) visit(node as Record<string, unknown>, pointer)
  const named = parentKey !== undefined && NAMED_ENTRY_KEYS.has(parentKey)
  for (const [key, value] of Object.entries(node)) {
    if (!named && (DATA_KEYS.has(key) || key.startsWith('x-'))) continue
    walk(value, `${pointer}/${escapePointerToken(key)}`, visit, Array.isArray(node) ? parentKey : key)
  }
}

export type DocumentScan = {
  /** A `$ref` points outside the document. */
  externalRef: boolean
  /** An `$id`, `$anchor` or `$dynamicAnchor` sits where {@link resolveSchemaIds} reads it. */
  schemaIds: boolean
  /** A `$ref` points into `#/paths/`. */
  pathRefs: boolean
}

/** Answers, in one walk and without building JSON pointers, what the loading steps after it need to know. */
export function scanDocument(document: unknown): DocumentScan {
  const scan: DocumentScan = { externalRef: false, schemaIds: false, pathRefs: false }
  const visit = ({ node, readsIds, parentKey }: { node: unknown; readsIds: boolean; parentKey?: string }): void => {
    if (!node || typeof node !== 'object') return
    const isArray = Array.isArray(node)
    const record = node as Record<string, unknown>
    const ref = record['$ref']
    if (typeof ref === 'string' && !ref.startsWith('#')) scan.externalRef = true
    if (typeof ref === 'string' && ref.startsWith('#/paths/')) scan.pathRefs = true
    if (readsIds && !isArray && TARGET_KEYS.some((key) => typeof record[key] === 'string')) scan.schemaIds = true
    const named = parentKey !== undefined && NAMED_ENTRY_KEYS.has(parentKey)
    for (const key in record) {
      const childReadsIds = readsIds && (named || !(DATA_KEYS.has(key) || key.startsWith('x-')))
      visit({ node: record[key], readsIds: childReadsIds, parentKey: isArray ? parentKey : key })
    }
  }
  visit({ node: document, readsIds: true })
  return scan
}

/**
 * The declaration in the nearest enclosing schema, else the only one, else `undefined`.
 */
function pick(declarations: Array<string> | undefined, pointer: string): string | undefined {
  if (!declarations) return undefined
  const enclosing = declarations.filter((target) => pointer === target || pointer.startsWith(`${target}/`))
  if (enclosing.length) return enclosing.reduce((a, b) => (b.length > a.length ? b : a))
  return declarations.length === 1 ? declarations[0] : undefined
}

/**
 * Rewrites, in place, each `$ref` to an `$id`, `$anchor` or `$dynamicAnchor`, and each `$dynamicRef`, into a
 * `#/...` pointer, so it is not fetched. Instance data and `x-` extensions are left as written.
 *
 * shortcut: `$id` matches the `$ref` string exactly and `$dynamicRef` resolves statically to the nearest
 * enclosing anchor, so a relative `$id` base or a recursively extended schema is not followed, upgrade when a spec needs that.
 */
export function resolveSchemaIds(document: unknown): void {
  const targets = memo.create<string, Array<string>>()
  const declare = (key: string, pointer: string) => memo(targets, key, () => []).push(pointer)
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
