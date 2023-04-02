import type { PluginFactoryOptions } from '@kubb/core'

export type Api = {
  resolvePath: (fileName: string, directory: string | undefined) => string | null
}

export type Options = {
  /**
   * Relative path to save the TypeScript types.
   * When output is a file it will save all models inside that file else it will create a file per schema item.
   * @default 'models'
   */
  output?: string
}

export type PluginOptions = PluginFactoryOptions<Options, false, Api>
