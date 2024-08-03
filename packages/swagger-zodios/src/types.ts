import type { Plugin, PluginFactoryOptions } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'

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
  /**
   * Include `alias` in the generated endpoints, allowing for usage such as `apiClient.getUserById()`
   *
   * Defaults to the `operationId` in the OpenAPI file document for a given route. If no `operationId` is defined, it will be generated.
   * @default `false`
   */
  includeOperationIdAsAlias: boolean | undefined
}

export type FileMeta = {
  pluginKey?: Plugin['key']
  tag?: string
}

export type PluginZodios = PluginFactoryOptions<'plugin-zodios', Options, ResolveOptions, never>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger-zodios']: PluginZodios
  }
}
