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
 * Content-type string for selecting request/response schemas from an OpenAPI spec.
 * Supports `'application/json'` or any other media type.
 *
 * @example
 * ```ts
 * const ct: ContentType = 'application/vnd.api+json'
 * ```
 */
export type ContentType = 'application/json' | (string & {})

/**
 * Extended OpenAPI 3.0 schema object that includes OpenAPI 3.1 and JSON Schema fields.
 * The parser uses these additional fields to handle newer spec versions.
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
 * Maps uppercase HTTP method names to lowercase for backwards compatibility.
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
 * HTTP method as a lowercase string (`'get' | 'post' | ...`).
 */
export type HttpMethod = Lowercase<ast.HttpMethod>

/**
 * Normalized OpenAPI document after parsing.
 */
export type Document = OASDocument

/**
 * API operation extracted from an OpenAPI document.
 */
export type Operation = OASOperation

/**
 * Discriminator object for `oneOf`/`anyOf` schemas in OpenAPI.
 */
export type DiscriminatorObject = OASDiscriminatorObject

/**
 * OpenAPI reference object pointing to a schema definition via `$ref`.
 */
export type ReferenceObject = OpenAPIV3.ReferenceObject

/**
 * OpenAPI response object from a spec that contains schema, status code, and headers.
 */
export type ResponseObject = OASResponseObject

/**
 * OpenAPI media type object that maps a content-type string to its schema.
 */
export type MediaTypeObject = OASMediaTypeObject

/**
 * Configuration options for the OpenAPI adapter. Controls spec validation,
 * content-type selection, server URL resolution, and how types are derived
 * from the spec.
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
   * Validate the OpenAPI spec with `@readme/openapi-parser` before parsing.
   * Set to `false` only when you have a known-invalid spec you still want to
   * generate from.
   *
   * @default true
   */
  validate?: boolean
  /**
   * Preferred media type when an operation defines several. Defaults to the
   * first JSON-compatible media type found in the spec.
   */
  contentType?: ContentType
  /**
   * Index into the `servers` array from your OpenAPI spec. Used to compute the
   * base URL for plugins that need it. Most projects pick `0` for the primary
   * server. Omit to leave `baseURL` undefined.
   */
  serverIndex?: number
  /**
   * Override values for `{variable}` placeholders in the selected server URL.
   * Only used when `serverIndex` is set. Variables you do not provide use
   * their `default` value from the spec.
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
   * How the `discriminator` field on `oneOf`/`anyOf` schemas is interpreted.
   * - `'strict'` — child schemas stay exactly as written; the discriminator
   *   narrows types at the call site but child shapes are not modified.
   * - `'inherit'` — Kubb propagates the discriminator property as a literal
   *   value into each child schema, so each branch's discriminator field is
   *   precisely typed.
   *
   * @default 'strict'
   */
  discriminator?: 'strict' | 'inherit'
} & Partial<ast.ParserOptions>

/**
 * Adapter options after defaults have been applied and schema name collisions resolved.
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
