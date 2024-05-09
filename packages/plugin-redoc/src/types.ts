import type { Plugin, PluginFactoryOptions } from '@kubb/core'

export type Options = {
  output?: {
    /**
     * Output for the generated doc, we are using [https://redocly.com/](https://redocly.com/) for the generation
     * @default 'docs.html'
     */
    path: string
  }
}

type ResolveOptions = {}

export type FileMeta = {
  pluginKey?: Plugin['key']
  tag?: string
}

export type PluginRedoc = PluginFactoryOptions<'plugin-redoc', Options, ResolveOptions, never>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/plugin-redoc']: PluginRedoc
  }
}
