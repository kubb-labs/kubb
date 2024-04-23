import type * as OasTypes from 'oas/types'

// external packages
export type { Operation } from 'oas/operation'
export type { HttpMethods as HttpMethod } from 'oas/types'
export type * as OasTypes from 'oas/types'
export type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export type contentType = 'application/json' | (string & {})

export type SchemaObject = OasTypes.SchemaObject & {
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
} satisfies Record<Uppercase<OasTypes.HttpMethods>, OasTypes.HttpMethods>
