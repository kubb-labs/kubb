import type { KubbPlugin, PluginFactoryOptions } from '@kubb/core'
import type { OverrideBy, ResolvePathOptions, SkipBy } from '@kubb/swagger'

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
  skipBy?: Array<SkipBy>
  /**
   * Array containing overrideBy paramaters to override `options` based on tags/operations/methods/paths.
   */
  overrideBy?: Array<OverrideBy<Options>>
  transformers?: {
    /**
     * Override the name of the Zod schema that is getting generated, this will also override the name of the file.
     */
    name?: (name: string) => string
  }
}

export type FileMeta = {
  pluginKey?: KubbPlugin['key']
  tag?: string
}

export type PluginOptions = PluginFactoryOptions<'swagger-zod', 'schema', Options, Options, never, ResolvePathOptions>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger-zod']: PluginOptions
  }
}
