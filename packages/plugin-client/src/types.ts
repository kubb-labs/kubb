import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'

import type { contentType, Oas } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions } from '@kubb/plugin-oas'
import type { Generator } from '@kubb/plugin-oas/generators'

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'clients', barrelType: 'named' }
   */
  output?: Output<Oas>
  /**
   * Define which contentType should be used.
   * By default, the first JSON valid mediaType is used
   */
  contentType?: contentType
  /**
   * Group the clients based on the provided name.
   */
  group?: Group
  /**
   * Array containing exclude parameters to exclude/skip tags/operations/methods/paths.
   */
  exclude?: Array<Exclude>
  /**
   * Array containing include parameters to include tags/operations/methods/paths.
   */
  include?: Array<Include>
  /**
   * Array containing override parameters to override `options` based on tags/operations/methods/paths.
   */
  override?: Array<Override<ResolvedOptions>>
  /**
   * Create `operations.ts` file with all operations grouped by methods.
   * @default false
   */
  operations?: boolean
  /**
   * Export urls that are used by operation x.
   * - 'export' makes them part of your barrel file.
   * - false does not make them exportable.
   * @default false
   * @example getGetPetByIdUrl
   */
  urlType?: 'export' | false
  /**
   * Client import path for API calls.
   * Used as `import client from '${client.importPath}'`.
   * Accepts relative and absolute paths; path changes are not performed.
   */
  importPath?: string
  /**
   * Allows you to set a custom base url for all generated calls.
   */
  baseURL?: string
  /**
   * ReturnType that is used when calling the client.
   * - 'data' returns ResponseConfig[data].
   * - 'full' returns ResponseConfig.
   * @default 'data'
   */
  dataReturnType?: 'data' | 'full'
  /**
   * How to style your params, by default no casing is applied
   * - 'camelcase' uses camelcase for the params names
   */
  paramsCasing?: 'camelcase'
  /**
   * How to pass your params.
   * - 'object' returns the params and pathParams as an object.
   * - 'inline' returns the params as comma separated params.
   * @default 'inline'
   */
  paramsType?: 'object' | 'inline'
  /**
   * How to pass your pathParams.
   * - 'object' returns the pathParams as an object.
   * - 'inline' returns the pathParams as comma separated params.
   * @default 'inline'
   */
  pathParamsType?: 'object' | 'inline'
  /**
   * Which parser can be used before returning the data.
   * - 'client' returns the data as-is from the client.
   * - 'zod' uses @kubb/plugin-zod to parse the data.
   * @default 'client'
   */
  parser?: 'client' | 'zod'
  /**
   * Which client should be used to do the HTTP calls.
   * - 'axios' uses axios client for HTTP requests.
   * - 'fetch' uses native fetch API for HTTP requests.
   * @default 'axios'
   */
  client?: 'axios' | 'fetch'
  /**
   * How to generate the client code.
   * - 'function' generates standalone functions for each operation.
   * - 'class' generates a class with methods for each operation.
   * - 'staticClass' generates a class with static methods for each operation.
   * @default 'function'
   */
  clientType?: 'function' | 'class' | 'staticClass'
  /**
   * Bundle the selected client into the generated `.kubb` directory.
   * When disabled the generated clients will import the shared runtime from `@kubb/plugin-client/clients/*`.
   * @default false
   * In version 5 of Kubb this is by default true
   */
  bundle?: boolean
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  /**
   * Define some generators next to the client generators
   */
  generators?: Array<Generator<PluginClient>>
}

type ResolvedOptions = {
  output: Output<Oas>
  group?: Options['group']
  baseURL: string | undefined
  client: Options['client']
  clientType: NonNullable<Options['clientType']>
  bundle: NonNullable<Options['bundle']>
  parser: NonNullable<Options['parser']>
  urlType: NonNullable<Options['urlType']>
  importPath: Options['importPath']
  dataReturnType: NonNullable<Options['dataReturnType']>
  pathParamsType: NonNullable<Options['pathParamsType']>
  paramsType: NonNullable<Options['paramsType']>
  paramsCasing: Options['paramsCasing']
}

export type PluginClient = PluginFactoryOptions<'plugin-client', Options, ResolvedOptions, never, ResolvePathOptions>
