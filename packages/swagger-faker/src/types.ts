import type { PluginFactoryOptions } from '@kubb/core'
import type { SkipBy } from '@kubb/swagger'

export type Options = {
  /**
   * Relative path to save the Faker mocks.
   * When output is a file it will save all models inside that file else it will create a file per schema item.
   * @default 'mocks'
   */
  output?: string
  /**
   * Group the Faker mocks based on the provided name.
   */
  groupBy?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file
     */
    type: 'tag'
    /**
     * Relative path to save the grouped Faker mocks.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `mocks/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './`
     * @default `"{{tag}}Mocks"`
     */
    exportAs?: string
  }
  skipBy?: SkipBy[]
  transformers?: {
    /**
     * Override the name of the faker data that is getting generated, this will also override the name of the file.
     */
    name?: (name: string) => string
  }
  /**
   * Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.
   * @default 'string'
   */
  dateType?: 'string' | 'date'
}

export type FileMeta = {
  pluginName?: string
  tag: string
}

export type ResolvePathOptions = { tag?: string }

export type PluginOptions = PluginFactoryOptions<'swagger-faker', Options, false, unknown, ResolvePathOptions>
