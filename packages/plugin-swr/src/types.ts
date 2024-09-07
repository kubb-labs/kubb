import type { Plugin, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'
import type { HttpMethod } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions } from '@kubb/plugin-oas'

export type Options = {
  output?: {
    /**
     * Output to save the SWR hooks.
     * @default `"hooks"`
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
  /**
   * Group the SWR hooks based on the provided name.
   */
  group?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file
     */
    type: 'tag'
    /**
     * Relative path to save the grouped SWR hooks.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `hooks/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './`
     * @default `"{{tag}}SWRHooks"`
     */
    exportAs?: string
  }
  /**
   * Array containing exclude parameters to exclude/skip tags/operations/methods/paths.
   */
  exclude?: Array<Exclude>
  /**
   * Array containing include parameters to include tags/operations/methods/paths.
   */
  include?: Array<Include>
  /**
   * Array containing override parameters to override `options` based on tags/operations/methods/paths.
   */
  override?: Array<Override<ResolvedOptions>>
  client?: {
    /**
     * Path to the client import path that will be used to do the API calls.
     * It will be used as `import client from '${client.importPath}'`.
     * It allow both relative and absolute path.
     * the path will be applied as is, so relative path shoule be based on the file being generated.
     * @default '@kubb/plugin-client/client'
     */
    importPath?: string
    /**
     * ReturnType that needs to be used when calling client().
     *
     * `Data` will return ResponseConfig[data].
     *
     * `Full` will return ResponseConfig.
     * @default `'data'`
     * @private
     */
    dataReturnType?: 'data' | 'full'
  }
  query?: {
    /**
     * Define which HttpMethods can be used for queries
     * @default ['get']
     */
    methods?: Array<HttpMethod>
    /**
     * Path to the useQuery that will be used to do the useQuery functionality.
     * It will be used as `import { useQuery } from '${importPath}'`.
     * It allows both relative and absolute path.
     * the path will be applied as is, so relative path should be based on the file being generated.
     * @default '@tanstack/react-query' if 'framework' is set to 'react'
     */
    importPath?: string
  }
  mutation?: {
    /**
     * Define which HttpMethods can be used for queries
     * @default ['post', 'put', 'delete']
     */
    methods?: Array<HttpMethod>
    /**
     * Path to the useQuery that will be used to do the useQuery functionality.
     * It will be used as `import { useQuery } from '${importPath}'`.
     * It allows both relative and absolute path.
     * the path will be applied as is, so relative path should be based on the file being generated.
     * @default '@tanstack/react-query' if 'framework' is set to 'react'
     */
    importPath?: string
  }
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  /**
   * Which parser can be used before returning the data to `swr`.
   * `'zod'` will use `@kubb/plugin-zod` to parse the data.
   */
  parser?: 'zod'
}

type ResolvedOptions = {
  client: Required<NonNullable<Options['client']>>
  parser: Options['parser']
  mutation: NonNullable<Options['mutation']>
  query: NonNullable<Options['query']>
}

export type FileMeta = {
  pluginKey?: Plugin['key']
  tag?: string
}

export type PluginSwr = PluginFactoryOptions<'plugin-swr', Options, ResolvedOptions, never, ResolvePathOptions>
