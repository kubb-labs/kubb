import type { SchemaNode } from './nodes/schema.ts'

/**
 * Generic JSON Schema optionality: a non-required field is optional, and a
 * non-required nullable field is nullish.
 */
export function optionality(schema: SchemaNode, required: boolean): SchemaNode {
  const nullable = schema.nullable ?? false

  return {
    ...schema,
    optional: !required && !nullable ? true : undefined,
    nullish: !required && nullable ? true : undefined,
  }
}
