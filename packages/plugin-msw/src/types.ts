import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'

import type { Exclude, Generator, Include, Override, ResolvePathOptions } from '@kubb/plugin-oas'

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'mocks', barrelType: 'named' }
   */
  output?: Output
  /**
   * Group the MSW mocks based on the provided name.
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
   * Create `handlers.ts` file with all handlers grouped by methods.
   * @default false
   */
  handlers?: boolean
  /**
   * Define some generators next to the msw generators
   */
  generators?: Array<Generator<PluginMsw>>
}
type ResolvedOptions = {
  output: Output
}

export type PluginMsw = PluginFactoryOptions<'plugin-msw', Options, ResolvedOptions, never, ResolvePathOptions>
