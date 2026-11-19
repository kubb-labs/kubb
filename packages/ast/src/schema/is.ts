import { narrowSchema } from '../guards.ts'
import type { SchemaNode, SchemaType } from '../nodes/schema.ts'
import { mergeSchema } from '../ref/index.ts'

/** `string` prints as a plain `string`, `text` is a non-blob string primitive, `const` a one-value enum, `enumLike` an enum or union of them, `untyped` is `void`, `any` or `unknown`. */
export type SchemaKind = 'binary' | 'string' | 'text' | 'scalar' | 'const' | 'enumLike' | 'untyped'

/** `ref` jumps to a resolved ref's target, `array` matches when some item matches. */
export type SchemaFollow = 'ref' | 'array'

export type IsOptions = {
  /** Links to look through. Following repeats and stops on a ref cycle. */
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
  enumLike: (node, test) => node.type === 'enum' || (node.type === 'union' && !!node.members?.length && node.members.every(test)),
  untyped: (node) => untypedTypes.has(node.type),
}

/** Whether a schema is of `kind`, looking at the node itself unless `follow` names links to look through. */
export function is(node: SchemaNode, kind: SchemaKind, { follow = [] }: IsOptions = {}): boolean {
  // `path` holds the ref targets above `current`, so a cycle stops without hiding a target a sibling branch reaches.
  const test = (current: SchemaNode, path: ReadonlySet<SchemaNode>): boolean => {
    if (follow.includes('ref') && current.type === 'ref' && current.schema) {
      return !path.has(current.schema) && test(mergeSchema(current), new Set(path).add(current.schema))
    }
    const child = (next: SchemaNode) => test(next, path)
    return kinds[kind](current, child) || (follow.includes('array') && current.type === 'array' && (current.items ?? []).some(child))
  }

  return test(node, new Set())
}
