import { narrowSchema } from '../guards.ts'
import type { EnumSchemaNode, SchemaNode, SchemaType } from '../nodes/schema.ts'
import { mergeSchema } from '../ref/index.ts'

/**
 * A question {@link is} answers about a schema:
 * - `'binary'` a `blob`
 * - `'string'` prints as a plain `string`: string-like types, and `date` or `time` with a `'string'` representation
 * - `'text'` a string primitive that is not a `blob`
 * - `'scalar'` a single value with no structure: string, number, boolean, temporal, `blob` or `enum` types
 * - `'const'` an enum with exactly one value
 * - `'enumLike'` an enum, or a non-empty union of enum-like members
 * - `'untyped'` `void`, `any` or `unknown`
 */
export type SchemaKind = 'binary' | 'string' | 'text' | 'scalar' | 'const' | 'enumLike' | 'untyped'

/**
 * A link {@link is} can follow on top of the node it looks at: `'ref'` jumps to a resolved ref's target,
 * merged with the fields set on the ref, and `'array'` matches when some item matches.
 */
export type SchemaFollow = 'ref' | 'array'

export type IsOptions = {
  /**
   * Links to follow. Following repeats, so `['ref', 'array']` also looks through a ref to an array of refs.
   * @default []
   */
  follow?: ReadonlyArray<SchemaFollow>
}

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'])
const scalarTypes = new Set<SchemaType>([
  'string',
  'email',
  'url',
  'uuid',
  'number',
  'integer',
  'bigint',
  'boolean',
  'date',
  'time',
  'datetime',
  'blob',
  'enum',
])
const untypedTypes = new Set<SchemaType>(['void', 'any', 'unknown'])

const kinds: Record<SchemaKind, (node: SchemaNode, test: (child: SchemaNode) => boolean) => boolean> = {
  binary: (node) => node.type === 'blob',
  string: (node) => {
    if (plainStringTypes.has(node.type)) return true
    const temporal = narrowSchema(node, 'date') ?? narrowSchema(node, 'time')
    return temporal ? temporal.representation !== 'date' : false
  },
  text: (node) => node.type !== 'blob' && node.primitive === 'string',
  scalar: (node) => scalarTypes.has(node.type),
  const: (node) => node.type === 'enum' && (node.namedEnumValues ?? node.enumValues ?? []).length === 1,
  enumLike: (node, test) => node.type === 'enum' || (node.type === 'union' && Boolean(node.members?.length) && node.members!.every(test)),
  untyped: (node) => untypedTypes.has(node.type),
}

/**
 * Whether a schema is of `kind`. Looks at the node itself, unless `follow` names the links to look through.
 * A ref cycle stops the walk, and the cyclic branch does not match.
 *
 * @example
 * ```ts
 * ast.schema.is(node, 'string')
 * ast.schema.is(node, 'binary', { follow: ['ref', 'array'] }) // Blob or Blob[] behind any refs
 * ```
 */
export function is(node: SchemaNode, kind: 'binary'): node is Extract<SchemaNode, { type: 'blob' }>
export function is(node: SchemaNode, kind: 'const'): node is EnumSchemaNode
export function is(node: SchemaNode, kind: SchemaKind, options?: IsOptions): boolean
export function is(node: SchemaNode, kind: SchemaKind, { follow = [] }: IsOptions = {}): boolean {
  const followsRefs = follow.includes('ref')
  const followsArrays = follow.includes('array')
  // The ref targets on the current path, so a cycle stops without hiding a target reached again on a sibling branch.
  const path = new Set<SchemaNode>()

  const test = (current: SchemaNode): boolean => {
    const entered: Array<SchemaNode> = []
    let resolved = current
    let cyclic = false
    while (followsRefs && resolved.type === 'ref' && resolved.schema && !cyclic) {
      cyclic = path.has(resolved.schema)
      if (!cyclic) {
        path.add(resolved.schema)
        entered.push(resolved.schema)
        resolved = mergeSchema(resolved)
      }
    }
    const matches = !cyclic && (kinds[kind](resolved, test) || (followsArrays && resolved.type === 'array' && (resolved.items ?? []).some(test)))
    for (const target of entered) path.delete(target)
    return matches
  }

  return test(node)
}
