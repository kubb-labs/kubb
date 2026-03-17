import { narrowSchema } from './guards.ts'
import type { SchemaNode } from './nodes/index.ts'
import type { SchemaType } from './nodes/schema.ts'

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'])

/**
 * Returns `true` when a schema node will be represented as a plain string in generated code.
 *
 * - `string`, `uuid`, `email`, `url`, `datetime` are always plain strings.
 * - `date` and `time` are plain strings when their `representation` is `'string'` rather than `'date'`.
 */
export function isPlainStringType(node: SchemaNode): boolean {
  if (plainStringTypes.has(node.type)) {
    return true
  }

  const temporal = narrowSchema(node, 'date') ?? narrowSchema(node, 'time')
  if (temporal) {
    return temporal.representation !== 'date'
  }

  return false
}

