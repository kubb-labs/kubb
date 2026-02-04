// external packages
import type { Operation as OASOperation } from 'oas/operation'
import type { OpenAPIV3 } from 'openapi-types'

export type * as OasTypes from 'oas/types'

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
  'x-nullable'?: boolean
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

/**
 * HTTP status code types for OpenAPI responses
 * Includes all standard HTTP status codes and 'default' for catch-all responses
 */
export type HttpStatus =
  // 1xx Informational
  | '100'
  | '101'
  | '102'
  | '103'
  // 2xx Success
  | '200'
  | '201'
  | '202'
  | '203'
  | '204'
  | '205'
  | '206'
  | '207'
  | '208'
  | '226'
  // 3xx Redirection
  | '300'
  | '301'
  | '302'
  | '303'
  | '304'
  | '305'
  | '306'
  | '307'
  | '308'
  // 4xx Client Error
  | '400'
  | '401'
  | '402'
  | '403'
  | '404'
  | '405'
  | '406'
  | '407'
  | '408'
  | '409'
  | '410'
  | '411'
  | '412'
  | '413'
  | '414'
  | '415'
  | '416'
  | '417'
  | '418'
  | '421'
  | '422'
  | '423'
  | '424'
  | '425'
  | '426'
  | '428'
  | '429'
  | '431'
  | '451'
  // 5xx Server Error
  | '500'
  | '501'
  | '502'
  | '503'
  | '504'
  | '505'
  | '506'
  | '507'
  | '508'
  | '510'
  | '511'
  // Special
  | 'default'
  // Fallback for non-standard codes
  | `${number}`
