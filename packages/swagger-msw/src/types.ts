import type { PluginFactoryOptions } from '@kubb/core'
import type { OverrideBy, ResolvePathOptions, SkipBy, AppMeta as SwaggerAppMeta } from '@kubb/swagger'

export type Options = {
  /**
   * Relative path to save the MSW mocks.
   * When output is a file it will save all models inside that file else it will create a file per schema item.
   * @default 'mocks'
   */
  output?: string
  /**
   * Group the MSW mocks based on the provided name.
   */
  groupBy?: {
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
  skipBy?: Array<SkipBy>
  overrideBy?: Array<OverrideBy<Options>>
  transformers?: {
    /**
     * Override the name of the MSW data that is getting generated, this will also override the name of the file.
     */
    name?: (name: string) => string
  }
}

export type FileMeta = {
  pluginName?: string
  tag?: string
}

export type PluginOptions = PluginFactoryOptions<'swagger-msw', Options, false, unknown, ResolvePathOptions>

export type AppMeta = SwaggerAppMeta
