import type { ast, Output, PluginFactoryOptions, ResolveNameParams, UserGroup } from '@kubb/core'

import type { contentType, HttpMethod, Oas, Operation, SchemaObject } from '@kubb/oas'
import type { Generator } from './generators/types.ts'

type GetOasOptions = {
  validate?: boolean
}

type Context = {
  getOas(options?: GetOasOptions): Promise<Oas>
  getBaseURL(): Promise<string | undefined>
}

declare global {
  namespace Kubb {
    interface PluginContext extends Context {}
    interface PluginRegistry {
      'plugin-oas': PluginOas
    }
  }
}

export type ResolvePathOptions = {
  pluginName?: string
  group?: {
    tag?: string
    path?: string
  }
  type?: ResolveNameParams['type']
}

export type Options = {
  /**
   * Validate your input(see kubb.config) based on '@apidevtools/swagger-parser'.
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
  group?: UserGroup
  /**
   * Which server to use from the array of `servers.url[serverIndex]`
   * @example
   * - `0` returns `http://petstore.swagger.io/api`
   * - `1` returns `http://localhost:3000`
   */
  serverIndex?: number
  /**
   * Override OpenAPI server variables when resolving the base URL.
   *
   * When `serverIndex` is set and the selected server URL contains `{variable}` placeholders
   * (as defined in the OpenAPI `servers[].variables` object), these values will be substituted.
   * Any variable not provided here falls back to its `default` value from the specification.
   *
   * @example
   * Given an OpenAPI spec with:
   * ```yaml
   * servers:
   *   - url: https://api.{env}.example.com
   *     variables:
   *       env:
   *         default: dev
   *         enum: [dev, staging, prod]
   * ```
   *
   * ```ts
   * pluginOas({
   *   serverIndex: 0,
   *   serverVariables: { env: 'prod' },
   * })
   * ```
   * Results in baseURL: `https://api.prod.example.com`
   */
  serverVariables?: Record<string, string>
  /**
   * Define which contentType should be used.
   * By default, uses the first valid JSON media type.
   */
  contentType?: contentType
  /**
   * Defines how the discriminator value should be interpreted during processing.
   * - 'strict' uses the oneOf schemas as defined, without modification.
   * - 'inherit' replaces the oneOf schema with the schema referenced by discriminator.mapping[key].
   * @default 'strict'
   * @see https://github.com/kubb-labs/kubb/issues/1736
   */
  discriminator?: 'strict' | 'inherit'
  /**
   * Override some behavior of the Oas class instance, see '@kubb/oas'
   */
  oasClass?: typeof Oas
  /**
   * Define some generators next to the JSON generation
   */
  generators?: Array<Generator<PluginOas>>
  /**
   * Resolve name collisions when schemas from different components share the same name (case-insensitive).
   *
   * When enabled, Kubb automatically detects and resolves collisions using intelligent suffixes:
   * - Cross-component collisions: Adds semantic suffixes based on the component type (Schema/Response/Request)
   * - Same-component collisions: Adds numeric suffixes (2, 3, ...) for case-insensitive duplicates
   * - Nested enum collisions: Includes root schema name in enum names to prevent duplicates across schemas
   *
   * When disabled (legacy behavior), collisions may result in duplicate files or overwrite issues.
   *
   * **Cross-component collision example:**
   * If you have "Order" in both schemas and requestBodies:
   * - With `collisionDetection: true`: Generates `OrderSchema.ts`, `OrderRequest.ts`
   * - With `collisionDetection: false`: May generate duplicate `Order.ts` files
   *
   * **Same-component collision example:**
   * If you have "Variant" and "variant" in schemas:
   * - With `collisionDetection: true`: Generates `Variant.ts`, `Variant2.ts`
   * - With `collisionDetection: false`: May overwrite or create duplicates
   *
   * **Nested enum collision example:**
   * If you have "params.channel" enum in both "NotificationTypeA" and "NotificationTypeB":
   * - With `collisionDetection: true`: Generates `notificationTypeAParamsChannelEnum`, `notificationTypeBParamsChannelEnum`
   * - With `collisionDetection: false`: Generates duplicate `paramsChannelEnum` in both files
   *
   * @default false (will be `true` in v5)
   * @see https://github.com/kubb-labs/kubb/issues/1999
   * @note In Kubb v5, this will be enabled by default and the deprecated `usedEnumNames` mechanism will be removed
   */
  collisionDetection?: boolean
}

/**
 * `propertyName` is the ref name + resolved with the nameResolver
 *  @example import { Pet } from './Pet'
 *
 * `originalName` is the original name used(in PascalCase), only used to remove duplicates
 *
 * `pluginName` can be used to override the current plugin being used, handy when you want to import a type/schema out of another plugin
 * @example import a type(plugin-ts) for a mock file(swagger-faker)
 */
export type Ref = {
  propertyName: string
  originalName: string
  path: string
  pluginName?: string
}
export type Refs = Record<string, Ref>

export type Resolver = {
  /**
   * Original name or name resolved by `resolveName({ name: operation?.getOperationId() as string, pluginName })`
   */
  name: string
  baseName: ast.FileNode['baseName']
  path: string
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

type ByContentType = {
  type: 'contentType'
  pattern: string | RegExp
}

export type Exclude = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName
export type Include = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName

export type Override<TOptions> = (ByTag | ByOperationId | ByPath | ByMethod | BySchemaName | ByContentType) & {
  // should be options: Omit<Partial<TOptions>, 'override'>
  options: Partial<TOptions>
}

type ResolvedOptions = Options & {
  output: Output<Oas>
  exclude: Array<Exclude>
  include?: Array<Include>
  override: Array<Override<ResolvedOptions>>
}

export type PluginOas = PluginFactoryOptions<'plugin-oas', Options, ResolvedOptions, Context, ResolvePathOptions>
