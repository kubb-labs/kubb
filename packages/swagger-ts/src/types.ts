import type { PluginFactoryOptions } from '@kubb/core'

export type Api = {
  resolvePath: (fileName: string, directory: string | undefined, options?: ResolvePathOptions) => string | null
}

export type Options = {
  /**
   * Relative path to save the TypeScript types.
   * When output is a file it will save all models inside that file else it will create a file per schema item.
   * @default 'models'
   */
  output?: string
  /**
   * Group the clients based on the provided name.
   * Tag will group based on the operation tag inside the Swagger file
   */
  groupBy?: 'tag'
  /**
   * Choose to use enum or as const for enum
   * @default `asConst`
   */
  enumType?: 'enum' | 'asConst'
}

export type ResolvePathOptions = { tag?: string }

export type PluginOptions = PluginFactoryOptions<Options, false, Api, ResolvePathOptions>
