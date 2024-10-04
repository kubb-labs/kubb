import type { Output, PluginFactoryOptions } from '@kubb/core'

export type Options = {
  output?: {
    /**
     * Output for the generated doc, [https://redocly.com/](https://redocly.com/) is being used for the generation
     * @default 'docs.html'
     */
    path: string
  }
}

type ResolveOptions = {
  output: Output
}

export type PluginRedoc = PluginFactoryOptions<'plugin-redoc', Options, ResolveOptions, never>
