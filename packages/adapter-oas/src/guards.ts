import type { DiscriminatorObject, ReferenceObject, SchemaObject } from './types.ts'

/**
 * Returns `true` when a schema should be treated as nullable.
 *
 * Recognizes all nullable signals across OAS versions: `nullable: true` (OAS 3.0),
 * `x-nullable: true` (vendor extension), `type: 'null'`, and `type: ['null', ...]` (OAS 3.1).
 */
export function isNullable(schema?: SchemaObject & { 'x-nullable'?: boolean }): boolean {
  const explicitNullable = schema?.nullable ?? schema?.['x-nullable']
  if (explicitNullable === true) return true

  const schemaType = schema?.type
  if (schemaType === 'null') return true
  if (Array.isArray(schemaType)) return schemaType.includes('null')

  return false
}

/**
 * Returns `true` when `obj` is an OpenAPI `$ref` pointer object.
 */
export function isReference(obj?: unknown): obj is ReferenceObject {
  return !!obj && typeof obj === 'object' && '$ref' in obj
}

/**
 * Returns `true` when `obj` is a schema with a structured OAS 3.x `discriminator` object,
 * excluding the Swagger 2 string form.
 */
export function isDiscriminator(obj?: unknown): obj is SchemaObject & { discriminator: DiscriminatorObject } {
  const record = obj as Record<string, unknown>
  return !!obj && !!record['discriminator'] && typeof record['discriminator'] !== 'string'
}

/**
 * Returns `true` when a schema is a binary payload: an octet-stream string body.
 */
export function isBinary(schema: SchemaObject): boolean {
  return schema.type === 'string' && schema.contentMediaType === 'application/octet-stream'
}
