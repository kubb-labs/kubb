import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'

import type { Oas, contentType } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions, Generator } from '@kubb/plugin-oas'
import type { PluginClient } from '@kubb/plugin-client'

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
  client?: Pick<PluginClient['options'], 'dataReturnType' | 'importPath' | 'baseURL'>

  /**
   * Group the mcp requests based on the provided name.
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
  client: Required<Omit<NonNullable<PluginMcp['options']['client']>, 'baseURL'>> & { baseURL?: string }
}

export type PluginMcp = PluginFactoryOptions<'plugin-mcp', Options, ResolvedOptions, never, ResolvePathOptions>
