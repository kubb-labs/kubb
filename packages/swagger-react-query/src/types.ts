import type { PluginFactoryOptions } from '@kubb/core'

export type Options = {
  /**
   * Output to save the Typescript models
   * @default hooks/query
   */
  output?: string
}

export type PluginOptions = PluginFactoryOptions<Options, false, undefined>
