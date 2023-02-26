import type { PluginFactoryOptions } from '@kubb/core'

export type Options = {
  /**
   * Output to save the ReactQuery hooks.
   * @default hooks/query
   */
  output?: string
  /**
   * Group the react-query hooks based on the provided name.
   * Tag will group based on the operation tag inside the Swagger file
   */
  groupBy?: 'tag'
}

export type ResolveIdOptions = { tag?: string }

export type PluginOptions = PluginFactoryOptions<Options, false, undefined, ResolveIdOptions>
