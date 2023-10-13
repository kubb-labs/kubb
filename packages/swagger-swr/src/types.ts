import type { PluginFactoryOptions } from '@kubb/core'
import type { ResolvePathOptions, SkipBy, AppMeta as SwaggerAppMeta } from '@kubb/swagger'

export type Options = {
  /**
   * Output to save the SWR hooks.
   * @default `"hooks"`
   */
  output?: string
  /**
   * Group the SWR hooks based on the provided name.
   */
  groupBy?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file
     */
    type: 'tag'
    /**
     * Relative path to save the grouped SWR hooks.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `hooks/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './`
     * @default `"{{tag}}SWRHooks"`
     */
    exportAs?: string
  }
  skipBy?: SkipBy[]
  /**
   * Path to the client that will be used to do the API calls.
   * Relative to the root
   * @default '@kubb/swagger-client/ts-client'
   */
  client?: string
  /**
   * Experimental
   *
   * ReturnType that needs to be used when calling client().
   *
   * `Data` will return ResponseConfig[data].
   *
   * `Full` will return ResponseConfig.
   * @default `'data'`
   * @private
   */
  dataReturnType?: 'data' | 'full'
  transformers?: {
    /**
     * Override the name of the hook that is getting generated, this will also override the name of the file.
     */
    name?: (name: string) => string
  }
}

export type FileMeta = {
  pluginName?: string
  tag?: string
}

export type PluginOptions = PluginFactoryOptions<'swagger-swr', Options, false, undefined, ResolvePathOptions>

export type AppMeta = SwaggerAppMeta
