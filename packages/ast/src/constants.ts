import type { SchemaType } from './nodes/schema.ts'

/**
 * Traversal depth for AST visitor utilities.
 *
 * - `'shallow'` recurses through every node except nested `Schema` subtrees, which it treats as
 *   leaves: a schema node itself is visited, but its children are not.
 * - `'deep'` recursively visits all descendant nodes, including schema subtrees.
 */
export type VisitorDepth = 'shallow' | 'deep'

/**
 * Schema type discriminators used by all AST schema nodes.
 *
 * Each value is a stable discriminator across the AST (for example `schema.type === schemaTypes.object`).
 */
export const schemaTypes = {
  string: 'string',
  number: 'number',
  integer: 'integer',
  bigint: 'bigint',
  boolean: 'boolean',
  null: 'null',
  any: 'any',
  unknown: 'unknown',
  void: 'void',
  object: 'object',
  array: 'array',
  tuple: 'tuple',
  union: 'union',
  intersection: 'intersection',
  enum: 'enum',
  ref: 'ref',
  date: 'date',
  datetime: 'datetime',
  time: 'time',
  uuid: 'uuid',
  email: 'email',
  url: 'url',
  ipv4: 'ipv4',
  ipv6: 'ipv6',
  blob: 'blob',
  never: 'never',
} as const satisfies Record<SchemaType, SchemaType>
