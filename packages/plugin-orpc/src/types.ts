import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { contentType, Oas } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions } from '@kubb/plugin-oas'
import type { Generator } from '@kubb/plugin-oas/generators'

export type Options = {
  /**
   * @default 'orpc'
   */
  output?: Output<Oas>
  /**
   * Define which contentType should be used.
   * By default, the first JSON valid mediaType will be used
   */
  contentType?: contentType
  /**
   * Group the contracts based on the provided name.
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
   * Path to @orpc/contract
   * It will be used as `import { oc } from '${importPath}'`.
   * @default '@orpc/contract'
   */
  importPath?: string
  /**
   * Path to Zod
   * It will be used as `import { z } from '${zodImportPath}'`.
   * @default 'zod'
   */
  zodImportPath?: string
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  /**
   * Generate a router file that groups all contracts by tag.
   * @default false
   */
  router?: boolean
  /**
   * Name of the exported router object.
   * @default 'router'
   */
  routerName?: string
  /**
   * Define some generators next to the contract generators
   */
  generators?: Array<Generator<PluginOrpc>>
}

type ResolvedOptions = {
  output: Output<Oas>
  group: Options['group']
  include: Options['include']
  exclude: NonNullable<Options['exclude']>
  override: NonNullable<Options['override']>
  transformers: NonNullable<Options['transformers']>
  importPath: NonNullable<Options['importPath']>
  zodImportPath: NonNullable<Options['zodImportPath']>
  router: NonNullable<Options['router']>
  routerName: NonNullable<Options['routerName']>
}

export type PluginOrpc = PluginFactoryOptions<'plugin-orpc', Options, ResolvedOptions, never, ResolvePathOptions>
