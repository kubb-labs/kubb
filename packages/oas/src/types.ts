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
   * Oas 3.1 adds support for `x-nullable` to specify that a schema can be null, even if `type` does not include `null`.
   */
  'x-nullable'?: boolean
  /**
   * Oas 3.1 adds support for `const` to specify that a schema can only have a single value, which must be equal to the value of `const`.
   */
  const?: string | number | boolean | null
  /**
   * Oas 3.1 adds support for `contentMediaType` to specify the media type of the content being described by the schema.
   */
  contentMediaType?: string
  $ref?: string
}

export const HttpMethods = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch',
  DELETE: 'delete',
  HEAD: 'head',
  OPTIONS: 'options',
  TRACE: 'trace',
} satisfies Record<Uppercase<OASHttpMethods>, OASHttpMethods>

export type HttpMethod = OASHttpMethods

export type Document = OASDocument

export type Operation = OASOperation

export type DiscriminatorObject = OASDiscriminatorObject

export type ReferenceObject = OpenAPIV3.ReferenceObject

export type ResponseObject = OASResponseObject

export type MediaTypeObject = OASMediaTypeObject
