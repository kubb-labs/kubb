import type { AdapterFactoryOptions, ast } from '@kubb/kit'
import type { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema'
import type { OpenAPIV3_1 } from 'openapi-types'

/**
 * Media type used to pick a schema from an operation's request or response.
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
export type SchemaObject = {
  externalDocs?: unknown
  xml?: unknown
  $schema?: string
  /** JSON Schema definitions that may be referenced from other schema locations. */
  $defs?: Record<string, SchemaObject>
  /** Legacy draft-07 name for `$defs`. */
  definitions?: Record<string, SchemaObject>
  deprecated?: boolean
  example?: unknown
  examples?: Array<unknown>
  nullable?: boolean
  readOnly?: boolean
  writeOnly?: boolean
  discriminator?: DiscriminatorObject
  'x-readme-ref-name'?: string
  /**
   * OAS 3.0 vendor extension: marks a schema as nullable without using `type: ['null', ...]`.
   */
  'x-nullable'?: boolean
  /**
   * OAS 3.1: constrains the schema to a single fixed value (equivalent to a one-item `enum`).
   */
  const?: string | number | boolean | null
  /**
   * OAS 3.1: media type of the schema content. Raw `'application/octet-stream'` content maps to `blob`.
   */
  contentMediaType?: string
  /**
   * OAS 3.1: encoding applied to string content, such as `base64`.
   */
  contentEncoding?: string
  /**
   * OAS 3.1: schema of the decoded value a string with `contentMediaType` holds.
   */
  contentSchema?: SchemaObject | ReferenceObject
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
   *
   * Alongside `prefixItems`, the JSON Schema boolean form applies: `items: false` closes the tuple
   * (no extra elements allowed), while `items: true` is equivalent to an unconstrained rest.
   */
  items?: SchemaObject | ReferenceObject | boolean
  /**
   * Allowed values for this schema.
   */
  enum?: Array<string | number | boolean | null>
} & (OpenAPIV3_1.SchemaObject | JSONSchema4 | JSONSchema6 | JSONSchema7)

/**
 * Normalized OpenAPI document after parsing.
 */
export type Document = OpenAPIV3_1.Document & Record<string, unknown>

/**
 * Single operation object (the `get`/`post`/… entry on a path item) plus any vendor extensions.
 */
export type OperationObject = OpenAPIV3_1.OperationObject & Record<string, unknown>

/**
 * Path item object holding the operations and shared parameters for a single URL path, plus the
 * OpenAPI 3.2 `additionalOperations` map for HTTP methods outside the fixed fields.
 */
export type PathItemObject = OpenAPIV3_1.PathItemObject & { additionalOperations?: Record<string, OperationObject> }

/**
 * Discriminator object for `oneOf`/`anyOf` schemas, with the OpenAPI 3.2 `defaultMapping` fallback schema.
 */
export type DiscriminatorObject = OpenAPIV3_1.DiscriminatorObject & { defaultMapping?: string }

/**
 * OpenAPI reference object pointing to a schema definition via `$ref`.
 */
export type ReferenceObject = OpenAPIV3_1.ReferenceObject

/**
 * OpenAPI response object holding the content and headers for one status code, with the OpenAPI 3.2
 * `summary`. From 3.2 `description` is optional.
 */
export type ResponseObject = Omit<OpenAPIV3_1.ResponseObject, 'description'> & { description?: string; summary?: string }

/**
 * OpenAPI request body object that maps content types to their media type objects.
 */
export type RequestBodyObject = OpenAPIV3_1.RequestBodyObject

/**
 * How one part of a multipart body is serialized, with the OpenAPI 3.2 nested `encoding`, `prefixEncoding` and `itemEncoding`.
 */
export type EncodingObject = Omit<OpenAPIV3_1.EncodingObject, 'style'> & {
  style?: string
  encoding?: Record<string, EncodingObject>
  prefixEncoding?: Array<EncodingObject>
  itemEncoding?: EncodingObject
}

/**
 * OpenAPI media type object, with the OpenAPI 3.2 `itemSchema` of one item of a stream and the
 * positional `prefixEncoding` and `itemEncoding` of a body sent as an array of parts.
 */
export type MediaTypeObject = Omit<OpenAPIV3_1.MediaTypeObject, 'encoding'> &
  Pick<EncodingObject, 'encoding' | 'prefixEncoding' | 'itemEncoding'> & { itemSchema?: SchemaObject | ReferenceObject }

/**
 * OpenAPI parameter object, narrowed so `in` is always one of the valid locations.
 */
export type ParameterObject = {
  in: 'cookie' | 'header' | 'path' | 'query' | 'querystring'
} & OpenAPIV3_1.ParameterObject

/**
 * OpenAPI security scheme object, read loosely since its fields depend on `type`. Adds the OpenAPI 3.2
 * `deviceAuthorization` flow, `oauth2MetadataUrl` and `deprecated`.
 */
export type SecuritySchemeObject = {
  type?: string
  description?: string
  scheme?: string
  bearerFormat?: string
  in?: string
  name?: string
  flows?: Record<string, ast.InputOAuthFlow>
  oauth2MetadataUrl?: string
  deprecated?: boolean
}

/**
 * OpenAPI tag object, with the OpenAPI 3.2 `summary`, `parent` and `kind`.
 */
export type TagObject = OpenAPIV3_1.TagObject & { summary?: string; parent?: string; kind?: string }

/**
 * OpenAPI server object describing a base URL and its `{variable}` substitutions, with the OpenAPI 3.2 `name`.
 */
export type ServerObject = OpenAPIV3_1.ServerObject & { name?: string }

/**
 * Selects which entry in the spec's `servers` array becomes the base URL and
 * supplies values for its `{variable}` placeholders.
 */
export type ServerOptions = {
  /**
   * Index into the `servers` array from your OpenAPI spec. Most projects pick
   * `0` for the primary server. Omit to leave `baseURL` undefined.
   */
  index?: number
  /**
   * Override values for `{variable}` placeholders in the selected server URL.
   * Variables you do not provide use their `default` value from the spec.
   */
  variables?: Record<string, string>
}

/**
 * Configuration for the OpenAPI adapter: spec validation, content-type selection,
 * server URL resolution, and how schema types are derived.
 *
 * @example
 * ```ts
 * adapterOas({
 *   validate: false,
 *   dateType: 'date',
 *   server: { index: 0, variables: { env: 'prod' } },
 * })
 * ```
 */
export type AdapterOasOptions = {
  /**
   * Validate the OpenAPI spec with `@readme/openapi-parser` before parsing. Each problem is
   * reported as a `KUBB_INVALID_SPEC` warning and generation continues. Set to `false` to skip the
   * check, which also makes generation faster on a large spec. An OpenAPI 3.2 document is not
   * validated yet and gets one warning that says so.
   *
   * @default true
   */
  validate?: boolean
  /**
   * Media type to keep for request bodies and responses. Omit to keep every
   * media type an operation declares.
   */
  contentType?: ContentType
  /**
   * Selects the server entry used to compute the base URL for plugins that need
   * it, and overrides its `{variable}` placeholders. Omit to leave `baseURL`
   * undefined.
   *
   * @example
   * ```ts
   * // spec server: "https://api.{env}.example.com"
   * server: { index: 0, variables: { env: 'prod' } }
   * // → baseURL: "https://api.prod.example.com"
   * ```
   */
  server?: ServerOptions
  /**
   * How the `discriminator` field on `oneOf`/`anyOf` schemas is interpreted.
   * - `'preserve'` child schemas stay exactly as written. The discriminator
   *   narrows types at the call site but child shapes are not modified.
   * - `'propagate'` Kubb pushes the discriminator property as a literal value
   *   into each child schema, so each branch's discriminator field is precisely
   *   typed.
   *
   * @default 'preserve'
   */
  discriminator?: 'preserve' | 'propagate'
  /**
   * Where inline enums live.
   * - `'inline'` keeps each enum inline on the property that declares it.
   * - `'root'` lifts every inline enum to a reusable top-level schema named after its context
   *   (e.g. `PetStatusEnum`) and references it everywhere it appears.
   *
   * @default 'inline'
   */
  enums?: 'inline' | 'root'
} & Partial<ast.ParserOptions>

/**
 * Adapter options after defaults have been applied.
 */
export type AdapterOasResolvedOptions = {
  validate: boolean
  contentType: AdapterOasOptions['contentType']
  server: AdapterOasOptions['server']
  discriminator: NonNullable<AdapterOasOptions['discriminator']>
  enums: NonNullable<AdapterOasOptions['enums']>
  dateType: NonNullable<AdapterOasOptions['dateType']>
  integerType: NonNullable<AdapterOasOptions['integerType']>
  unknownType: NonNullable<AdapterOasOptions['unknownType']>
  emptySchemaType: NonNullable<AdapterOasOptions['emptySchemaType']>
  enumSuffix: NonNullable<AdapterOasOptions['enumSuffix']>
}

/**
 * `@kubb/core` adapter factory type for the OpenAPI adapter.
 */
export type AdapterOas = AdapterFactoryOptions<'oas', AdapterOasOptions, AdapterOasResolvedOptions, Document>
