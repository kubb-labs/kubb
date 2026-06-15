import type { ArraySchemaNode, IntersectionSchemaNode, ObjectSchemaNode, PropertyNode, SchemaNode, UnionSchemaNode } from '../nodes/index.ts'
import { objectKey } from './codegen.ts'

/**
 * Converts a child schema to printer output. Plugins instantiate it with their own output type:
 * `string` for the zod and faker printers, `ts.TypeNode` for the TypeScript printer. A printer's
 * `this.transform` fits directly, so its `null` for an empty result carries through to `output`.
 */
export type SchemaTransform<TOutput> = (schema: SchemaNode) => TOutput

/**
 * A union or intersection member, or an array or tuple item, paired with its transformed output.
 */
export type MappedSchema<TOutput> = {
  /**
   * The original child schema, kept so the printer can read its metadata for leaf formatting.
   */
  schema: SchemaNode
  /**
   * The child schema after being run through the transform.
   */
  output: TOutput
}

/**
 * An object property paired with its transformed output.
 */
export type MappedProperty<TOutput> = {
  /**
   * The property name as written on the schema, before any identifier quoting.
   */
  name: string
  /**
   * The original property node, kept so the printer can read `required`, `schema`, and metadata.
   */
  property: PropertyNode
  /**
   * The property schema after being run through the transform.
   */
  output: TOutput
}

/**
 * Maps each property of an object schema to its transformed output. Pairs every result with the
 * original property so the printer keeps full control over modifiers, getters, and key syntax.
 *
 * @example
 * ```ts
 * const entries = mapSchemaProperties(node, (schema) => this.transform(schema))
 * // entries: [{ name: 'id', property, output: 'z.number()' }, ...]
 * ```
 */
export function mapSchemaProperties<TOutput>(node: ObjectSchemaNode, transform: SchemaTransform<TOutput>): Array<MappedProperty<TOutput>> {
  return node.properties.map((property) => ({ name: property.name, property, output: transform(property.schema) }))
}

/**
 * Maps each member of a union or intersection schema to its transformed output, pairing every
 * result with the original member.
 */
export function mapSchemaMembers<TOutput>(node: UnionSchemaNode | IntersectionSchemaNode, transform: SchemaTransform<TOutput>): Array<MappedSchema<TOutput>> {
  return (node.members ?? []).map((schema) => ({ schema, output: transform(schema) }))
}

/**
 * Maps each item of an array or tuple schema to its transformed output, pairing every result with
 * the original item.
 */
export function mapSchemaItems<TOutput>(node: ArraySchemaNode, transform: SchemaTransform<TOutput>): Array<MappedSchema<TOutput>> {
  return (node.items ?? []).map((schema) => ({ schema, output: transform(schema) }))
}

/**
 * Emits a lazy getter for a circular-ref property position, `get name() { return body }`. The key
 * is quoted only when it is not a valid identifier. Used by the string printers to defer evaluation
 * of a recursive schema until first access.
 *
 * @example
 * ```ts
 * lazyGetter({ name: 'parent', body: 'z.lazy(() => Pet)' })
 * // "get parent() { return z.lazy(() => Pet) }"
 * ```
 */
export function lazyGetter({ name, body }: { name: string; body: string }): string {
  return `get ${objectKey(name)}() { return ${body} }`
}
