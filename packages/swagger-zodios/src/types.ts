import type { KubbPlugin, PluginFactoryOptions } from '@kubb/core'
import type { AppMeta as SwaggerAppMeta } from '@kubb/swagger'

export type Options = {
  /**
   * Relative path to save the Zodios instance.
   * Output should be a file(ending with .ts or .js).
   * @default 'zodios.ts'
   */
  output?: string
}

type ResolveOptions = {
  baseURL: string | undefined
  name: string
}

export type FileMeta = {
  pluginKey?: KubbPlugin['key']
  tag?: string
}

type AppMeta = SwaggerAppMeta

export type PluginOptions = PluginFactoryOptions<'swagger-zodios', Options, ResolveOptions, never, AppMeta>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger-zodios']: PluginOptions
  }
}
