import type { PluginFactoryOptions } from '@kubb/core'

export type API = {
  resolveId: (fileName: string, directory: string | undefined) => string | null
}

export type Options = {
  /**
   * Relative path to save the Zodios instance.
   * When output is a file it will save all models inside that file else it will create a file per schema item.
   * @default 'zodios.ts'
   */
  output?: string
}

export type FileMeta = {
  pluginName?: string
  tag: string
}

export type PluginOptions = PluginFactoryOptions<'swagger-zodios', Options, false, API>
