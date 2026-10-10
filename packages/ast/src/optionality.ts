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

/**
 * Defaults `required` to `false` and derives the schema's `optional`/`nullish` flags from it.
 * Shared build step of `createProperty` and `createParameter`.
 */
export function withRequired<T extends { required?: boolean; schema: SchemaNode }>(props: T): T & { required: boolean } {
  const required = props.required ?? false

  return { ...props, required, schema: optionality(props.schema, required) }
}
