import type { AppMeta as AppCoreMeta, Path, PluginFactoryOptions } from '@kubb/core'
import type Oas from 'oas'
import type Operation from 'oas/operation'
import type { HttpMethods as HttpMethod } from 'oas/rmoas.types'
import type { OpenAPIV3 } from 'openapi-types'
import type { GetSchemasProps } from './utils/getSchemas.ts'

// eslint-disable-next-line @typescript-eslint/ban-types
export type ContentType = 'application/json' | (string & {})

export type ResolvePathOptions = { pluginName?: string; tag?: string }

export type API = {
  getOas: () => Promise<Oas>
  getSchemas: (options?: Pick<GetSchemasProps, 'includes'>) => Promise<Record<string, OpenAPIV3.SchemaObject>>
  getBaseURL: () => Promise<string | undefined>
  contentType?: ContentType
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
   * Which server to use from the array of `servers.url[serverIndex]`
   * @example `0` will return `http://petstore.swagger.io/api` and `1` will return `http://localhost:3000`
   * servers:
  - url: http://petstore.swagger.io/api
  - url: http://localhost:3000
   * @default 0
   */
  serverIndex?: number
  /**
   * Override ContentType to be used for requests and responses.
   */
  contentType?: ContentType
}

export type PluginOptions = PluginFactoryOptions<'swagger', Options, false, API>

export type { default as Oas } from 'oas'

export type { default as Operation } from 'oas/operation'

export type { OpenAPIV3 } from 'openapi-types'
export type { HttpMethods as HttpMethod } from 'oas/rmoas.types'

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
  headerParams?: OperationSchema
  request?: OperationSchema
  response: OperationSchema
  errors?: OperationSchema[]
}

type SkipByTag = {
  type: 'tag'
  pattern: string | RegExp
}

type SkipByOperationId = {
  type: 'operationId'
  pattern: string | RegExp
}

type SkipByPath = {
  type: 'path'
  pattern: string | RegExp
}

type SkipByMethod = {
  type: 'method'
  pattern: HttpMethod | RegExp
}

export type SkipBy = SkipByTag | SkipByOperationId | SkipByPath | SkipByMethod

export type AppMeta = AppCoreMeta & { schemas: OperationSchemas; operation: Operation }
