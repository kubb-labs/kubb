// external packages

import type { AdapterFactoryOptions } from '@kubb/core'
import { ast } from '@kubb/core'
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
export type ContentType = 'application/json' | (string & {})

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
export const HttpMethods = Object.fromEntries(Object.entries(ast.httpMethods).map(([lower, upper]) => [upper, lower])) as Record<
  Uppercase<ast.HttpMethod>,
  Lowercase<ast.HttpMethod>
>

/**
 * Lowercase HTTP method string as used by the `oas` package (`'get' | 'post' | ...`).
 */
export type HttpMethod = Lowercase<ast.HttpMethod>

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

/**
 * User-facing options for `adapterOas(...)`.
 *
 * Extends `ParserOptions` from `@kubb/ast` with adapter-specific controls
 * like spec validation and server URL selection.
 *
 * @example
 * ```ts
 * adapterOas({
 *   validate: false,
 *   dateType: 'date',
 *   serverIndex: 0,
 *   serverVariables: { env: 'prod' },
 * })
 * ```
 */
export type AdapterOasOptions = {
  /**
   * Validate the OpenAPI spec before parsing.
   * @default true
   */
  validate?: boolean
  /**
   * Preferred content-type used when extracting request/response schemas.
   * Defaults to the first valid JSON media type found in the spec.
   */
  contentType?: ContentType
  /**
   * Index into `oas.api.servers` for computing `baseURL`.
   * `0` → first server, `1` → second server. Omit to leave `baseURL` undefined.
   */
  serverIndex?: number
  /**
   * Override values for `{variable}` placeholders in the selected server URL.
   * Only used when `serverIndex` is set.
   *
   * @example
   * ```ts
   * // spec server: "https://api.{env}.example.com"
   * serverVariables: { env: 'prod' }
   * // → baseURL: "https://api.prod.example.com"
   * ```
   */
  serverVariables?: Record<string, string>
  /**
   * How the discriminator field is interpreted.
   * - `'strict'`  — uses `oneOf` schemas as written in the spec.
   * - `'inherit'` — propagates discriminator values into child schemas from `discriminator.mapping`.
   * @default 'strict'
   */
  discriminator?: 'strict' | 'inherit'
} & Partial<ast.ParserOptions>

/**
 * Resolved adapter options available at runtime after defaults have been applied.
 */
export type AdapterOasResolvedOptions = {
  validate: boolean
  contentType: AdapterOasOptions['contentType']
  serverIndex: AdapterOasOptions['serverIndex']
  serverVariables: AdapterOasOptions['serverVariables']
  discriminator: NonNullable<AdapterOasOptions['discriminator']>
  dateType: NonNullable<AdapterOasOptions['dateType']>
  integerType: NonNullable<AdapterOasOptions['integerType']>
  unknownType: NonNullable<AdapterOasOptions['unknownType']>
  emptySchemaType: NonNullable<AdapterOasOptions['emptySchemaType']>
  enumSuffix: AdapterOasOptions['enumSuffix']
  /**
   * Map from original `$ref` paths to their collision-resolved schema names.
   * Populated after each `parse()` call.
   *
   * @example
   * ```ts
   * nameMapping.get('#/components/schemas/Order') // 'Order'
   * nameMapping.get('#/components/responses/Order') // 'OrderResponse'
   * ```
   */
  nameMapping: Map<string, string>
}

/**
 * `@kubb/core` adapter factory type for the OpenAPI adapter.
 */
export type AdapterOas = AdapterFactoryOptions<'oas', AdapterOasOptions, AdapterOasResolvedOptions, Document>
