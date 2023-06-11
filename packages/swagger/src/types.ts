import type { KubbConfig, Path, PluginFactoryOptions } from '@kubb/core'
import type Oas from 'oas'
import type { OpenAPIV3 } from 'openapi-types'
import type { OasOptions } from './parsers/oasParser.ts'

export type API = {
  oas: Promise<Oas>
  getOas: (config: KubbConfig, options?: OasOptions) => Promise<Oas>
  getBaseURL: () => Promise<string | undefined>
}

export type Options = {
  /**
   * Validate your input(see kubb.config) based on @apidevtools/swagger-parser
   * @default true
   */
  validate?: boolean
  /**
   * Relative path to save the JSON models.
   * False will not generate the schema JSON's.
   * @default 'schemas'
   */
  output?: string | false
  /**
   * Which server to use from
   * @example 0 will return `http://petstore.swagger.io/api` and 0 will return `http://localhost:3000`
   * servers:
  - url: http://petstore.swagger.io/api
  - url: http://localhost:3000
   * @default 0
   */
  server?: number
}

export type PluginOptions = PluginFactoryOptions<Options, false, API>

export type { default as Oas } from 'oas'

export type { Operation } from 'oas'

export type { OpenAPIV3 } from 'openapi-types'
export type { HttpMethods as HttpMethod } from 'oas/dist/rmoas.types.ts'

export type Resolver = {
  name: string
  fileName: string
  filePath: Path
}

export type OperationSchema = {
  /**
   * Converted name, contains already `PathParams`, `QueryParams`, ...
   */
  name: string
  /**
   * OperationName in PascalCase, only being used in OperationGenerator
   */
  operationName?: string
  description?: string
  schema: OpenAPIV3.SchemaObject
  statusCode?: number
}

export type OperationSchemas = {
  pathParams?: OperationSchema
  queryParams?: OperationSchema
  request?: OperationSchema
  response: OperationSchema
  errors?: OperationSchema[]
}
