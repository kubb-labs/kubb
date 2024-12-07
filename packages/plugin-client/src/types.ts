import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'

import type { Exclude, Generator, Include, Override, ResolvePathOptions } from '@kubb/plugin-oas'

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'clients', barrelType: 'named' }
   */
  output?: Output
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
   * Path to the client import path that will be used to do the API calls.
   * It will be used as `import client from '${client.importPath}'`.
   * It allows both relative and absolute path but be aware that we will not change the path.
   * @default '@kubb/plugin-client/client'
   */
  importPath?: string
  /**
   * Allows you to set a custom base url for all generated calls.
   */
  baseURL?: string
  /**
   * ReturnType that will be used when calling the client.
   * - 'data' will return ResponseConfig[data].
   * - 'full' will return ResponseConfig.
   * @default 'data'
   */
  dataReturnType?: 'data' | 'full'
  /**
   * How to style your params, by default no casing is applied
   * - 'camelcase' will use camelcase for the params names
   */
  paramsCasing?: 'camelcase'
  /**
   * How to pass your params
   * - 'object' will return the params and pathParams as an object.
   * - 'inline' will return the params as comma separated params.
   * @default 'inline'
   */
  paramsType?: 'object' | 'inline'
  /**
   * How to pass your pathParams.
   * - 'object' will return the pathParams as an object.
   * - 'inline' will return the pathParams as comma separated params.
   * @default 'inline'
   */
  pathParamsType?: 'object' | 'inline'
  /**
   * Which parser can be used before returning the data
   * - 'zod'  will use `@kubb/plugin-zod` to parse the data.
   * @default 'client'
   */
  parser?: 'client' | 'zod'
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
  output: Output
  group?: Options['group']
  baseURL: string | undefined
  parser: NonNullable<Options['parser']>
  importPath: NonNullable<Options['importPath']>
  dataReturnType: NonNullable<Options['dataReturnType']>
  pathParamsType: NonNullable<Options['pathParamsType']>
  paramsType: NonNullable<Options['paramsType']>
  paramsCasing: Options['paramsCasing']
}

export type PluginClient = PluginFactoryOptions<'plugin-client', Options, ResolvedOptions, never, ResolvePathOptions>
