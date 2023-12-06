import type { KubbFile, KubbPlugin, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { AppMeta as SwaggerAppMeta, Exclude, Include, Override, ResolvePathOptions } from '@kubb/swagger'
import type { Mutation } from './components/Mutation.tsx'
import type { Query } from './components/Query.tsx'
import type { QueryOptions } from './components/QueryOptions.tsx'

type Templates = {
  mutation?: typeof Mutation.templates | false
  query?: typeof Query.templates | false
  queryOptions?: typeof QueryOptions.templates | false
}

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
    exportType?: 'barrel' | false
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
   * Array containing exclude paramaters to exclude/skip tags/operations/methods/paths.
   */
  exclude?: Array<Exclude>
  /**
   * Array containing include paramaters to include tags/operations/methods/paths.
   */
  include?: Array<Include>
  /**
   * Array containing override paramaters to override `options` based on tags/operations/methods/paths.
   */
  override?: Array<Override<ResolvedOptions>>
  /**
   * Path to the client import path that will be used to do the API calls.
   * It will be used as `import client from '${clientImportPath}'`.
   * It allow both relative and absolute path.
   * the path will be applied as is, so relative path shoule be based on the file being generated.
   * @default '@kubb/swagger-client/client'
   */
  clientImportPath?: string
  /**
   * Experimental
   *
   * ReturnType that needs to be used when calling client().
   *
   * `Data` will return ResponseConfig[data].
   *
   * `Full` will return ResponseConfig.
   * @default `'data'`
   * @private
   */
  dataReturnType?: 'data' | 'full'
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  /**
   * Make it possible to override one of the templates
   */
  templates?: Partial<Templates>
}

type ResolvedOptions = {
  clientImportPath: NonNullable<Options['clientImportPath']>
  dataReturnType: NonNullable<Options['dataReturnType']>
  templates: NonNullable<Templates>
}

export type FileMeta = {
  pluginKey?: KubbPlugin['key']
  tag?: string
}
type AppMeta = SwaggerAppMeta
export type PluginOptions = PluginFactoryOptions<'swagger-swr', Options, ResolvedOptions, never, ResolvePathOptions, AppMeta>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger-swr']: PluginOptions
  }
}
