import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'

import type { Oas, contentType } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions, Generator } from '@kubb/plugin-oas'
import type { PluginClient } from '@kubb/plugin-client'
import type { PluginReactQuery } from '@kubb/plugin-react-query'

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'mcp', barrelType: 'named' }
   */
  output?: Output<Oas>
  /**
   * Define which contentType should be used.
   * By default, the first JSON valid mediaType will be used
   */
  contentType?: contentType
  /**
   * ReturnType that will be used when calling cy.request.
   * - 'data' will return ResponseConfig[data].
   * - 'full' will return ResponseConfig.
   * @default 'data'
   */
  dataReturnType?: 'data' | 'full'
  baseURL?: string
  /**
   * Group the mcp requests based on the provided name.
   */
  group?: Group
  client?: Pick<PluginClient['options'], 'dataReturnType' | 'importPath' | 'baseURL'>

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
  pathParamsType?: PluginClient['options']['pathParamsType']
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  /**
   * Define some generators next to the Mcp generators.
   */
  generators?: Array<Generator<PluginMcp>>
}

type ResolvedOptions = {
  output: Output<Oas>
  group: Options['group']
  client: Required<Omit<NonNullable<PluginReactQuery['options']['client']>, 'baseURL'>> & { baseURL?: string }
  baseURL: Options['baseURL'] | undefined
  dataReturnType: NonNullable<Options['dataReturnType']>
  pathParamsType: NonNullable<Options['pathParamsType']>
  paramsCasing: Options['paramsCasing']
  paramsType: NonNullable<Options['paramsType']>
}

export type PluginMcp = PluginFactoryOptions<'plugin-mcp', Options, ResolvedOptions, never, ResolvePathOptions>
