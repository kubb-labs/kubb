import type { Plugin, PluginFactoryOptions } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'

import type { Exclude, Include, Override, Parser, ResolvePathOptions } from '@kubb/plugin-oas'

export type Options = {
  output?: {
    /**
     * Relative path to save the MSW mocks.
     * When output is a file it will save all models inside that file else it will create a file per schema item.
     * @default 'mocks'
     */
    path: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './'`
     */
    exportAs?: string
    /**
     * Add an extension to the generated imports and exports, default it will not use an extension
     */
    extName?: KubbFile.Extname
    /**
     * Define what needs to exported, here you can also disable the export of barrel files
     * @default `'barrel'`
     */
    exportType?: 'barrel' | 'barrelNamed' | false
  }
  /**
   * Group the MSW mocks based on the provided name.
   */
  group?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file
     */
    type: 'tag'
    /**
     * Relative path to save the grouped MSW mocks.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `mocks/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './`
     * @default `"{{tag}}Handlers"`
     */
    exportAs?: string
  }
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
  parsers?: Array<Parser<PluginMsw> | 'mock' | 'operations'>
}
type ResolvedOptions = {
  extName: KubbFile.Extname | undefined
  parsers: NonNullable<Options['parsers']>
}

export type FileMeta = {
  pluginKey?: Plugin['key']
  tag?: string
}

export type PluginMsw = PluginFactoryOptions<'plugin-msw', Options, ResolvedOptions, never, ResolvePathOptions>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/plugin-msw']: PluginMsw
  }
}
