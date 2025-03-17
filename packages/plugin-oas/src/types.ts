import type { Group, Output, Plugin } from '@kubb/core'
import type { PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'

import type { HttpMethod, Oas, Operation, SchemaObject, contentType } from '@kubb/oas'
import type { Generator } from './generator.tsx'

export type ResolvePathOptions = {
  pluginKey?: Plugin['key']
  group?: {
    tag?: string
    path?: string
  }
  type?: ResolveNameParams['type']
}

export type API = {
  getOas: () => Promise<Oas>
  getBaseURL: () => Promise<string | undefined>
}

export type Options = {
  /**
   * Validate your input(see kubb.config) based on '@readme/openapi-parser'.
   * @default true
   */
  validate?: boolean
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'schemas', barrelType: 'named' }
   */
  output?: Output<Oas>
  /**
   * Group the JSON files based on the provided name.
   */
  group?: Group
  /**
   * Which server to use from the array of `servers.url[serverIndex]`
   * @example
   * - `0` will return `http://petstore.swagger.io/api`
   * - `1` will return `http://localhost:3000`
   */
  serverIndex?: number
  /**
   * Define which contentType should be used.
   * By default, the first JSON valid mediaType will be used
   */
  contentType?: contentType
  /**
   * Override some behaviour of the Oas class instance, see '@kubb/oas'
   */
  oasClass?: typeof Oas
  /**
   * Define some generators next to the JSON generation
   */
  generators?: Array<Generator<PluginOas>>
}

/**
 * `propertyName` is the ref name + resolved with the nameResolver
 *  @example import { Pet } from './Pet'
 *
 * `originalName` is the original name used(in PascalCase), only used to remove duplicates
 *
 * `pluginKey` can be used to override the current plugin being used, handy when you want to import a type/schema out of another plugin
 * @example import a type(plugin-ts) for a mock file(swagger-faker)
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
  operationName: string
  description?: string
  statusCode?: number
  keys?: string[]
  keysToOmit?: string[]
  withData?: boolean
}

export type OperationSchemas = {
  pathParams?: OperationSchema & { keysToOmit?: never }
  queryParams?: OperationSchema & { keysToOmit?: never }
  headerParams?: OperationSchema & { keysToOmit?: never }
  request?: OperationSchema
  response: OperationSchema
  responses: Array<OperationSchema>
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
// TODO implement as alternative for ByMethod
// type ByMethods = {
//   type: 'methods'
//   pattern: Array<HttpMethod>
// }

type BySchemaName = {
  type: 'schemaName'
  pattern: string | RegExp
}

export type Exclude = ByTag | ByOperationId | ByPath | ByMethod
export type Include = ByTag | ByOperationId | ByPath | ByMethod

export type Override<TOptions> = (ByTag | ByOperationId | ByPath | ByMethod | BySchemaName) & {
  options: Partial<TOptions>
}

type ResolvedOptions = Options & {
  output: Output<Oas>
}

export type PluginOas = PluginFactoryOptions<'plugin-oas', Options, ResolvedOptions, API, ResolvePathOptions>
