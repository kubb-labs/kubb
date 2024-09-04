import type { Plugin, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'

import type { HttpMethod } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions } from '@kubb/plugin-oas'
import type { Client } from './components/index.ts'

export type Options = {
  output?: {
    /**
     * Output to save the clients.
     * @default `"clients"``
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
     * @default `'barrelNamed'`
     */
    exportType?: 'barrel' | 'barrelNamed' | false
  }
  /**
   * Group the clients based on the provided name.
   */
  group?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file
     */
    type: 'tag'
    /**
     * Relative path to save the grouped clients.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `clients/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './`
     * @default `"{{tag}}Service"`
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
     * It allows both relative and absolute path.
     * the path will be applied as is, so relative path should be based on the file being generated.
     * @default '@kubb/plugin-client/client'
     */
    importPath?: string
    /**
     * Define which HttpMethods can be used for queries
     * @default ['get', 'post', 'put', 'delete']
     */
    methods?: Array<HttpMethod>
    template?: typeof Client
  }
  /**
   * Create `operations.ts` file with all operations grouped by methods.
   * @default `false`
   */
  operations?: boolean
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
  /**
   * How to pass your pathParams.
   *
   * `object` will return the pathParams as an object.
   *
   * `inline` will return the pathParams as comma separated params.
   * @default `'inline'`
   * @private
   */
  pathParamsType?: 'object' | 'inline'
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
}

type ResolvedOptions = {
  baseURL: string | undefined
  client: NonNullable<Options['client']>
  dataReturnType: NonNullable<Options['dataReturnType']>
  pathParamsType: NonNullable<Options['pathParamsType']>
}

export type FileMeta = {
  pluginKey?: Plugin['key']
  tag?: string
}

export type PluginClient = PluginFactoryOptions<'plugin-client', Options, ResolvedOptions, never, ResolvePathOptions>
