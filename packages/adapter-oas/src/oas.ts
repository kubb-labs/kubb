import type { ast } from '@kubb/kit'
import type { DiscriminatorObject, Document, ReferenceObject, SchemaObject } from './types.ts'

const legacyDocuments = new WeakSet<Document>()

/**
 * Marks a document upgraded from Swagger 2.0 or OpenAPI 3.0, so its enums keep the loose `nullable` reading.
 */
export function markLegacyDocument(document: Document): void {
  legacyDocuments.add(document)
}

/**
 * Returns `true` for a document upgraded from Swagger 2.0 or OpenAPI 3.0.
 */
export function isLegacyDocument(document: Document | undefined): boolean {
  return !!document && legacyDocuments.has(document)
}

/**
 * Returns `true` when a schema should be treated as nullable.
 *
 * Recognizes all nullable signals across OAS versions: `nullable: true` (OAS 3.0),
 * `x-nullable: true` (vendor extension), `type: 'null'`, and `type: ['null', ...]` (OAS 3.1).
 * A sibling `enum` without `null` makes the schema non-nullable, except in documents upgraded from 3.0.
 */
export function isNullable(schema?: SchemaObject & { 'x-nullable'?: boolean }, document?: Document): boolean {
  const explicitNullable = schema?.nullable ?? schema?.['x-nullable']
  if (explicitNullable === true) return true

  const schemaType = schema?.type
  const typeAllowsNull = schemaType === 'null' || (Array.isArray(schemaType) && schemaType.includes('null'))
  if (typeAllowsNull && Array.isArray(schema?.enum) && !schema.enum.includes(null)) return isLegacyDocument(document)

  return typeAllowsNull
}

/**
 * Returns `true` for an OpenAPI 3.2 or later document. Swagger 2.0 and OpenAPI 3.0 documents are
 * upgraded to 3.1 before parsing, so `openapi` is always set here.
 */
export function isOpenApi32(document: Document): boolean {
  const [major = 0, minor = 0] = String(document.openapi).split('.').map(Number)
  return major > 3 || (major === 3 && minor >= 2)
}

export function pickStrings<TKey extends string>(source: unknown, keys: ReadonlyArray<TKey>): Partial<Record<TKey, string>> | undefined {
  if (!source || typeof source !== 'object') return undefined
  const entries = keys.flatMap((key) => {
    const value = (source as Record<string, unknown>)[key]
    return typeof value === 'string' ? [[key, value] as const] : []
  })
  return entries.length ? (Object.fromEntries(entries) as Partial<Record<TKey, string>>) : undefined
}

export function getExternalDocs(source: unknown): ast.ExternalDocs | undefined {
  const docs = pickStrings(source, ['url', 'description'])
  return docs?.url ? { url: docs.url, ...(docs.description !== undefined && { description: docs.description }) } : undefined
}

/**
 * Returns the `x-*` keys of `source` as-is, or `undefined` when there are none.
 */
export function pickExtensions(source: object | null | undefined): Record<string, unknown> | undefined {
  if (!source) return undefined
  const entries = Object.entries(source).filter(([key]) => key.startsWith('x-'))
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

/**
 * Returns `true` when `obj` is an OpenAPI `$ref` pointer object.
 */
export function isReference(obj?: unknown): obj is ReferenceObject {
  return !!obj && typeof obj === 'object' && '$ref' in obj
}

/**
 * Returns `true` when `obj` is a schema with a structured OAS 3.x `discriminator` object that names a
 * `propertyName`, excluding the Swagger 2 string form and a 3.2 discriminator that only sets `defaultMapping`.
 */
export function isDiscriminator(obj?: unknown): obj is SchemaObject & { discriminator: DiscriminatorObject } {
  const discriminator = (obj as Record<string, unknown> | undefined)?.['discriminator']
  return !!discriminator && typeof discriminator === 'object' && typeof (discriminator as DiscriminatorObject).propertyName === 'string'
}

/**
 * Returns `true` when a schema is a raw binary payload.
 */
export function isBinary(schema: SchemaObject): boolean {
  return (
    schema.contentMediaType === 'application/octet-stream' && schema.contentEncoding === undefined && (schema.type === undefined || schema.type === 'string')
  )
}

/**
 * Keywords that only annotate a schema. A schema with nothing else does not constrain the value.
 */
const annotationKeywords = new Set(['title', 'description', 'default', 'example', 'examples', 'deprecated', 'readOnly', 'writeOnly', 'externalDocs'])

/**
 * Returns the binary schema for a non-JSON entry the OAS 3.1 upgrade emptied out, or `undefined`
 * when the entry carries a schema of its own. The upgrade rewrites `format: 'binary'` into
 * `contentMediaType` and drops it whenever it only repeats the media type key, for any binary
 * media type (`application/octet-stream`, `application/pdf`, `image/png`, ...), not just
 * `application/octet-stream`. Without the fallback such a body resolves to the empty schema type
 * instead of a blob. Annotations such as `description` survive the upgrade and are kept.
 */
export function getBinaryFallbackSchema(mediaType: string | undefined, schema: SchemaObject | ReferenceObject | undefined): SchemaObject | undefined {
  if (!mediaType || isJsonMimeType(mediaType)) return undefined
  if (schema && Object.keys(schema).some((key) => !annotationKeywords.has(key) && !key.startsWith('x-'))) return undefined

  return { ...(schema as SchemaObject | undefined), type: 'string', contentMediaType: 'application/octet-stream' }
}

/**
 * MIME type fragments that mark a media type as JSON-like.
 *
 * A content type is JSON when it contains any of these substrings. The `+json` entry catches
 * structured-syntax suffixes such as `application/vnd.api+json`.
 */
const jsonMimeFragments = ['application/json', 'application/x-json', 'text/json', 'text/x-json', '+json'] as const

/**
 * Returns `true` when a media type string is JSON-like.
 *
 * @example
 * ```ts
 * isJsonMimeType('application/json')         // true
 * isJsonMimeType('application/vnd.api+json') // true
 * isJsonMimeType('multipart/form-data')      // false
 * ```
 */
export function isJsonMimeType(mimeType: string): boolean {
  const lower = mimeType.toLowerCase()
  return jsonMimeFragments.some((fragment) => lower.includes(fragment))
}
