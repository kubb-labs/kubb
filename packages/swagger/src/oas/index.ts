import type * as OasTypes from 'oas/types'

// external packages
export type { default as Oas } from 'oas'
export type { Operation } from 'oas/operation'
export type { HttpMethods as HttpMethod } from 'oas/types'
export type * as OasTypes from 'oas/types'
export type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export type SchemaObject = OasTypes.SchemaObject & { 'x-nullable'?: boolean }
