import type { KubbFile, Plugin, PluginFactoryOptions } from '@kubb/core'

export type Options = {
  output?: {
    /**
     * Relative path to save the Zodios instance.
     * Output should be a file(ending with .ts or .js).
     * @default 'zodios.ts'
     */
    path: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './'`
     */
    exportAs?: string
    /**
     * Add an extension to the generated imports and exports, default it will not use an extension
     */
    extName?: KubbFile.Extname
    /**
     * Define what needs to exported, here you can also disable the export of barrel files
     * @default `'barrel'`
     */
    exportType?: 'barrel' | 'barrelNamed' | false
  }
}

type ResolveOptions = {
  baseURL: string | undefined
  name: string
}

export type FileMeta = {
  pluginKey?: Plugin['key']
  tag?: string
}

export type PluginOptions = PluginFactoryOptions<'swagger-zodios', Options, ResolveOptions, never>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger-zodios']: PluginOptions
  }
}
