// external packages
import type { Operation as OASOperation } from 'oas/operation'
import type {
  DiscriminatorObject as OASDiscriminatorObject,
  OASDocument,
  MediaTypeObject as OASMediaTypeObject,
  ResponseObject as OASResponseObject,
  SchemaObject as OASSchemaObject,
} from 'oas/types'
import type { OpenAPIV3 } from 'openapi-types'
import type { HttpMethod as AstHttpMethod } from '@kubb/ast/types'
import { httpMethods } from '@kubb/ast'

export type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export type contentType = 'application/json' | (string & {})

export type SchemaObject = OASSchemaObject & {
  /**
   * OAS 3.1 extension: allows marking a schema as nullable even when `type` does not include `'null'`.
   */
  'x-nullable'?: boolean
  /**
   * OAS 3.1: constrains the schema to a single fixed value.
   * Semantically equivalent to a one-item `enum`.
   */
  const?: string | number | boolean | null
  /**
   * OAS 3.1: specifies the media type of the schema content.
   * When set to `'application/octet-stream'` on a `string` schema, the schema is treated as binary (`blob`).
   */
  contentMediaType?: string
  $ref?: string
  /**
   * OAS 3.1 / JSON Schema: positional items in a tuple schema.
   * Replaces the OAS 3.0 multi-item `items` array syntax.
   */
  prefixItems?: Array<SchemaObject | ReferenceObject>
  /**
   * JSON Schema: maps regex patterns to sub-schemas for additional property validation.
   */
  patternProperties?: Record<string, SchemaObject | boolean>
  /**
   * OAS 3.0 / JSON Schema: single-schema form.
   * The OAS base type already includes this, but we re-declare it here to ensure
   * the single-schema overload takes precedence over the multi-schema tuple form.
   */
  items?: SchemaObject | ReferenceObject
  /**
   * Enum values for this schema (narrowed from `unknown[]` in the base type).
   */
  enum?: Array<string | number | boolean | null>
}

/**
 * Canonical uppercase->lowercase HTTP method map.
 * Re-exported for backwards compatibility with previous adapter-oas API.
 */
export const HttpMethods = Object.fromEntries(Object.entries(httpMethods).map(([lower, upper]) => [upper, lower])) as Record<
  Uppercase<AstHttpMethod>,
  Lowercase<AstHttpMethod>
>

export type HttpMethod = Lowercase<AstHttpMethod>

export type Document = OASDocument

export type Operation = OASOperation

export type DiscriminatorObject = OASDiscriminatorObject

export type ReferenceObject = OpenAPIV3.ReferenceObject

export type ResponseObject = OASResponseObject

export type MediaTypeObject = OASMediaTypeObject
