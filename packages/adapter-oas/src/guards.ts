import { isRef } from 'oas/types'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { isPlainObject } from 'remeda'
import type { DiscriminatorObject, SchemaObject } from './types.ts'

/**
 * Returns `true` when `doc` is a Swagger 2.0 document (no `openapi` key).
 *
 * @example
 * ```ts
 * if (isOpenApiV2Document(doc)) {
 *   // doc is OpenAPIV2.Document
 * }
 * ```
 */
export function isOpenApiV2Document(doc: unknown): doc is OpenAPIV2.Document {
  return !!doc && isPlainObject(doc) && !('openapi' in doc)
}

/**
 * Returns `true` when `doc` is an OpenAPI 3.x document (has an `openapi` key).
 *
 * @example
 * ```ts
 * if (isOpenApiV3Document(doc)) {
 *   // doc is OpenAPIV3.Document
 * }
 * ```
 */
export function isOpenApiV3Document(doc: unknown): doc is OpenAPIV3.Document {
  return !!doc && isPlainObject(doc) && 'openapi' in doc
}

/**
 * Returns `true` when `doc` is an OpenAPI 3.1 document (version string starts with `'3.1'`).
 *
 * @example
 * ```ts
 * if (isOpenApiV3_1Document(doc)) {
 *   // doc is OpenAPIV3_1.Document — use prefixItems, const, etc.
 * }
 * ```
 */
export function isOpenApiV3_1Document(doc: unknown): doc is OpenAPIV3_1.Document {
  return !!doc && isPlainObject(doc) && 'openapi' in (doc as object) && (doc as { openapi: string }).openapi.startsWith('3.1')
}

/**
 * Returns `true` when a schema should be treated as nullable.
 *
 * Recognises all nullable signals across OAS versions: `nullable: true` (OAS 3.0),
 * `x-nullable: true` (vendor extension), `type: 'null'`, and `type: ['null', ...]` (OAS 3.1).
 *
 * @example
 * ```ts
 * isNullable({ type: 'string', nullable: true }) // true
 * isNullable({ type: ['string', 'null'] })       // true
 * isNullable({ type: 'string' })                 // false
 * ```
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
 *
 * @example
 * ```ts
 * isReference({ $ref: '#/components/schemas/Pet' }) // true
 * isReference({ type: 'string' })                   // false
 * ```
 */
export function isReference(obj?: unknown): obj is OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject {
  return !!obj && isRef(obj as object)
}

/**
 * Returns `true` when `obj` is a schema with a structured OAS 3.x `discriminator` object.
 *
 * @example
 * ```ts
 * isDiscriminator({ discriminator: { propertyName: 'type', mapping: {} } }) // true
 * isDiscriminator({ discriminator: 'type' })                                 // false (Swagger 2 string form)
 * ```
 */
export function isDiscriminator(obj?: unknown): obj is SchemaObject & { discriminator: DiscriminatorObject } {
  const record = obj as Record<string, unknown>
  return !!obj && !!record['discriminator'] && typeof record['discriminator'] !== 'string'
}
