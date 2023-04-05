import type { PluginFactoryOptions } from '@kubb/core'

export type Api = {
  resolveId: (fileName: string, directory: string | undefined) => string | null
}

export type Options = {
  /**
   * Relative path to save the zodios instance.
   * When output is a file it will save all models inside that file else it will create a file per schema item.
   * @default 'zodios.ts'
   */
  output?: string
}

export type PluginOptions = PluginFactoryOptions<Options, false, Api>
