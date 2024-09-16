import type { Output, PluginFactoryOptions } from '@kubb/core'

export type Options = {
  output?: {
    /**
     * Output for the generated doc, we are using [https://redocly.com/](https://redocly.com/) for the generation
     * @default 'docs.html'
     */
    path: string
  }
}

type ResolveOptions = {
  output: Output
}

export type PluginRedoc = PluginFactoryOptions<'plugin-redoc', Options, ResolveOptions, never>
