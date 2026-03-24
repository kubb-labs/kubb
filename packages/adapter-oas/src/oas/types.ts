// external packages

import { httpMethods } from '@kubb/ast'
import type { HttpMethod as AstHttpMethod } from '@kubb/ast/types'
import type { Operation as OASOperation } from 'oas/operation'
import type {
  DiscriminatorObject as OASDiscriminatorObject,
  OASDocument,
  MediaTypeObject as OASMediaTypeObject,
  ResponseObject as OASResponseObject,
  SchemaObject as OASSchemaObject,
} from 'oas/types'
import type { OpenAPIV3 } from 'openapi-types'

/**
 * Re-exports of `openapi-types` for use by adapter consumers.
 */
export type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

/**
 * Content-type string used when selecting request/response schemas from a spec.
 *
 * Accepts `'application/json'` or any arbitrary media type string.
 *
 * @example
 * ```ts
 * const ct: contentType = 'application/vnd.api+json'
 * ```
 */
export type contentType = 'application/json' | (string & {})

/**
 * Augments `oas`'s `SchemaObject` with OAS 3.1 / JSON Schema fields the parser needs.
 *
 * @example
 * ```ts
 * const schema: SchemaObject = {
 *   type: 'string',
 *   const: 'dog',
 *   contentMediaType: 'application/octet-stream',
 * }
 * ```
 */
export type SchemaObject = OASSchemaObject & {
  /**
   * OAS 3.0 vendor extension: marks a schema as nullable without using `type: ['null', ...]`.
   */
  'x-nullable'?: boolean
  /**
   * OAS 3.1: constrains the schema to a single fixed value (equivalent to a one-item `enum`).
   */
  const?: string | number | boolean | null
  /**
   * OAS 3.1: media type of the schema content. `'application/octet-stream'` on a `string` schema maps to `blob`.
   */
  contentMediaType?: string
  $ref?: string
  /**
   * OAS 3.1: positional tuple items, replacing the multi-item `items` array from OAS 3.0.
   */
  prefixItems?: Array<SchemaObject | ReferenceObject>
  /**
   * JSON Schema: maps regex patterns to sub-schemas for validating additional properties.
   */
  patternProperties?: Record<string, SchemaObject | boolean>
  /**
   * Single-schema form of `items`. Narrowed from the base type to take precedence over the tuple overload.
   */
  items?: SchemaObject | ReferenceObject
  /**
   * Enum values for this schema (narrowed from `unknown[]`).
   */
  enum?: Array<string | number | boolean | null>
}

/**
 * Uppercase → lowercase HTTP method map, re-exported for backwards compatibility.
 *
 * @example
 * ```ts
 * HttpMethods['GET'] // 'get'
 * HttpMethods['POST'] // 'post'
 * ```
 */
export const HttpMethods = Object.fromEntries(Object.entries(httpMethods).map(([lower, upper]) => [upper, lower])) as Record<
  Uppercase<AstHttpMethod>,
  Lowercase<AstHttpMethod>
>

/**
 * Lowercase HTTP method string as used by the `oas` package (`'get' | 'post' | ...`).
 */
export type HttpMethod = Lowercase<AstHttpMethod>

/**
 * Normalized OpenAPI document type used throughout the adapter.
 */
export type Document = OASDocument

/**
 * Operation wrapper type returned by the `oas` package.
 */
export type Operation = OASOperation

/**
 * OpenAPI `discriminator` object attached to a `oneOf`/`anyOf` schema.
 */
export type DiscriminatorObject = OASDiscriminatorObject

/**
 * OpenAPI `$ref` pointer object (`{ $ref: string }`).
 */
export type ReferenceObject = OpenAPIV3.ReferenceObject

/**
 * OpenAPI response object type (may contain `content`, `description`, `headers`).
 */
export type ResponseObject = OASResponseObject

/**
 * OpenAPI media type object that maps a content-type to a schema.
 */
export type MediaTypeObject = OASMediaTypeObject
