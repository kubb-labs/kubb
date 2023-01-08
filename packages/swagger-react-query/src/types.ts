import type { PluginFactoryOptions } from '@kubb/core'

export type Options = {
  /**
   * Output to save the Typescript models
   * @default hooks/query
   */
  output?: string
  /**
   * Options to override models used for React-Query
   */
  types?: {
    /**
     * Relative path to store models/type related to a react-query hook(params, request, response)
     * @default ''
     */
    output: string
  }
}

export type PluginOptions = PluginFactoryOptions<Options, false, undefined>
