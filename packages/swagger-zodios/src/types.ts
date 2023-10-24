import type { KubbPlugin, PluginFactoryOptions } from '@kubb/core'

export type Options = {
  /**
   * Relative path to save the Zodios instance.
   * Output should be a file(ending with .ts or .js).
   * @default 'zodios.ts'
   */
  output?: string
}

export type FileMeta = {
  pluginKey?: KubbPlugin['key']
  tag?: string
}

export type PluginOptions = PluginFactoryOptions<'swagger-zodios', 'controller', Options, false, never>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger-zodios']: PluginOptions
  }
}
