import type { PluginFactoryOptions } from '@kubb/core'

export type Options = {
  /**
   * Relative path to save the Zod schemas.
   * When output is a file it will save all models inside that file else it will create a file per schema item.
   * @default 'zod'
   */
  output?: string
  /**
   * Group the Zod schemas based on the provided name.
   */
  groupBy?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file
     */
    type: 'tag'
    /**
     * Relative path to save the grouped Zod schemas.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `zod/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './`
     * @default `"{{tag}}Schemas"`
     */
    exportAs?: string
  }
}

export type ResolvePathOptions = { tag?: string }

export type PluginOptions = PluginFactoryOptions<'swagger-zod', Options, false, unknown, ResolvePathOptions>
