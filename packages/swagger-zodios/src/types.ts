import type { PluginFactoryOptions } from '@kubb/core'

export type Options = {
  /**
   * Relative path to save the Zodios instance.
   * Output should be a file(ending with .ts or .js).
   * @default 'zodios.ts'
   */
  output?: string
}

export type FileMeta = {
  pluginName?: string
  tag?: string
}

export type PluginOptions = PluginFactoryOptions<'swagger-zodios', Options, false, never>
