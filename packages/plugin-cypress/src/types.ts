import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'

import type { Oas, contentType } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions, Generator } from '@kubb/plugin-oas'

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'mocks', barrelType: 'named' }
   */
  output?: Output<Oas>
  /**
   * Define which contentType should be used.
   * By default, the first JSON valid mediaType will be used
   */
  contentType?: contentType
  baseURL?: string
  /**
   * Group the Cypress requests based on the provided name.
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
   * Which parser should be used before returning the data to the `Response` of Cypress.
   *  - `'faker'` will use `@kubb/plugin-faker` to generate the data for the response
   *  - `'data'` will use your custom data to generate the data for the response
   * @default 'data'
   */
  parser?: 'data' | 'faker'
  /**
   * Define some generators next to the Cypress generators.
   */
  generators?: Array<Generator<PluginCypress>>
}

type ResolvedOptions = {
  output: Output<Oas>
  group: Options['group']
  parser: NonNullable<Options['parser']>
  baseURL: Options['baseURL'] | undefined
}

export type PluginCypress = PluginFactoryOptions<'plugin-cypress', Options, ResolvedOptions, never, ResolvePathOptions>
