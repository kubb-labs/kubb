import type { PluginFactoryOptions } from '@kubb/core'
import type { SkipBy } from '@kubb/swagger'

export type Options = {
  /**
   * Relative path to save the TypeScript types.
   * When output is a file it will save all models inside that file else it will create a file per schema item.
   * @default 'models'
   */
  output?: string
  /**
   * Group the TypeScript types based on the provided name.
   */
  groupBy?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file.
     */
    type: 'tag'
    /**
     * Relative path to save the grouped TypeScript Types.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `models/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
  }
  skipBy?: SkipBy[]
  /**
   * Choose to use `enum` or `as const` for enums
   * @default `asConst`
   */
  enumType?: 'enum' | 'asConst' | 'asPascalConst'
  transformers?: {
    /**
     * Override the name of the TypeScript type that is getting generated, this will also override the name of the file.
     */
    name?: (name: string) => string
  }
}

export type FileMeta = {
  pluginName?: string
  tag: string
}

export type ResolvePathOptions = { tag?: string }

export type PluginOptions = PluginFactoryOptions<'swagger-ts', Options, false, unknown, ResolvePathOptions>
