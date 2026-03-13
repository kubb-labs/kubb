// external packages
import type { Operation as OASOperation } from 'oas/operation'
import type * as OasTypes from 'oas/types'
import type { OpenAPIV3 } from 'openapi-types'

export type { OasTypes }

import type {
  DiscriminatorObject as OASDiscriminatorObject,
  OASDocument,
  HttpMethods as OASHttpMethods,
  MediaTypeObject as OASMediaTypeObject,
  ResponseObject as OASResponseObject,
  SchemaObject as OASSchemaObject,
} from 'oas/types'

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
}

/** Re-exported from `constants.ts` for backwards compatibility. */
export { httpMethods as HttpMethods } from './constants.ts'

export type HttpMethod = OASHttpMethods

export type Document = OASDocument

export type Operation = OASOperation

export type DiscriminatorObject = OASDiscriminatorObject

export type ReferenceObject = OpenAPIV3.ReferenceObject

export type ResponseObject = OASResponseObject

export type MediaTypeObject = OASMediaTypeObject
