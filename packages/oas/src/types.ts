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
