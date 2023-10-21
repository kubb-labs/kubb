import type { KubbPlugin } from '@kubb/core'
import type { AppMeta as AppCoreMeta, KubbFile, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type Oas from 'oas'
import type Operation from 'oas/operation'
import type { HttpMethods as HttpMethod } from 'oas/rmoas.types'
import type { OpenAPIV3 } from 'openapi-types'
import type { GetSchemasProps } from './utils/getSchemas.ts'

// eslint-disable-next-line @typescript-eslint/ban-types
export type ContentType = 'application/json' | (string & {})

export type ResolvePathOptions = { pluginKey?: KubbPlugin['key']; tag?: string; type?: ResolveNameParams['type'] }

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
   * Override ContentType that will be used for requests and responses.
   */
  contentType?: ContentType
}

export type PluginOptions = PluginFactoryOptions<'swagger', 'schema', Options, false, API>

export type { default as Oas } from 'oas'
export type { default as Operation } from 'oas/operation'
export type { HttpMethods as HttpMethod } from 'oas/rmoas.types'
export type { OpenAPIV3 } from 'openapi-types'

export type Resolver = {
  /**
   * Original name or name resolved by `resolveName({ name: operation?.getOperationId() as string, pluginName })`
   */
  name: string
  baseName: KubbFile.BaseName
  path: KubbFile.Path
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
  schema: OpenAPIV3.SchemaObject & { $ref?: OpenAPIV3.ReferenceObject['$ref'] }
  statusCode?: number
  keys?: string[]
  keysToOmit?: string[]
}

export type OperationSchemas = {
  pathParams?: OperationSchema & { keysToOmit?: never }
  queryParams?: OperationSchema & { keysToOmit?: never }
  headerParams?: OperationSchema & { keysToOmit?: never }
  request?: OperationSchema
  response: OperationSchema
  errors?: Array<OperationSchema>
}

type ByTag = {
  type: 'tag'
  pattern: string | RegExp
}

type ByOperationId = {
  type: 'operationId'
  pattern: string | RegExp
}

type ByPath = {
  type: 'path'
  pattern: string | RegExp
}

type ByMethod = {
  type: 'method'
  pattern: HttpMethod | RegExp
}

export type SkipBy = ByTag | ByOperationId | ByPath | ByMethod

export type OverrideBy<TOptions> = (ByTag | ByOperationId | ByPath | ByMethod) & { options: Partial<TOptions> }

export type AppMeta = AppCoreMeta & { schemas: OperationSchemas; operation: Operation }
