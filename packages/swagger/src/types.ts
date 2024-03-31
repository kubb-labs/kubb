import type { Plugin } from '@kubb/core'
import type { KubbFile, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { HttpMethod, Oas, Operation, SchemaObject } from './oas/index.ts'
import type { GetSchemasProps } from './utils/getSchemas.ts'

// eslint-disable-next-line @typescript-eslint/ban-types
export type ContentType = 'application/json' | (string & {})

export type FileResolver = (name: string, ref: Ref) => string | null | undefined

export type ResolvePathOptions = {
  pluginKey?: Plugin['key']
  tag?: string
  type?: ResolveNameParams['type']
}

export type API = {
  getOas: () => Promise<Oas>
  getSchemas: (options?: Pick<GetSchemasProps, 'includes'>) => Promise<Record<string, SchemaObject>>
  getBaseURL: () => Promise<string | undefined>
  contentType?: ContentType
}

export type Options = {
  /**
   * Validate your input(see kubb.config) based on @apidevtools/swagger-parser
   * @default true
   */
  validate?: boolean
  output?:
    | {
        /**
         * Relative path to save the JSON models.
         * False will not generate the schema JSON's.
         * @default 'schemas'
         */
        path: string
      }
    | false

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

/**
 * `propertyName` is the ref name + resolved with the nameResolver
 *  @example `import { Pet } from './Pet'`
 *
 * `originalName` is the original name used(in PascalCase), only used to remove duplicates
 *
 * `pluginKey` can be used to override the current plugin being used, handy when you want to import a type/schema out of another plugin
 * @example import a type(swagger-ts) for a mock file(swagger-faker)
 */

export type Ref = {
  propertyName: string
  originalName: string
  path: KubbFile.OptionalPath
  pluginKey?: Plugin['key']
}
export type Refs = Record<string, Ref>

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
  schema: SchemaObject
  operation?: Operation
  /**
   * OperationName in PascalCase, only being used in OperationGenerator
   */
  operationName?: string
  description?: string
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
  statusCodes?: Array<OperationSchema>
  errors?: Array<OperationSchema>
}

export type OperationsByMethod = Record<string, Record<HttpMethod, { operation: Operation; schemas: OperationSchemas }>>

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

export type Exclude = ByTag | ByOperationId | ByPath | ByMethod
export type Include = ByTag | ByOperationId | ByPath | ByMethod

export type Override<TOptions> = (ByTag | ByOperationId | ByPath | ByMethod) & {
  options: Partial<TOptions>
}

export type ImportMeta = {
  ref: Ref
  path: string
  isTypeOnly: boolean
}

export type PluginOptions = PluginFactoryOptions<'swagger', Options, Options, API, never>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger']: PluginOptions
  }
}
