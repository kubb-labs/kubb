import type { KubbFile, KubbPlugin, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { AppMeta as SwaggerAppMeta, Exclude, Include, Override, ResolvePathOptions } from '@kubb/swagger'
import type { Mutation } from './components/Mutation.tsx'
import type { Query } from './components/Query.tsx'
import type { QueryKey } from './components/QueryKey.tsx'
import type { QueryOptions } from './components/QueryOptions.tsx'

type Templates = {
  mutation?: typeof Mutation.templates | false
  query?: typeof Query.templates | false
  queryOptions?: typeof QueryOptions.templates | false
  queryKey?: typeof QueryKey.templates | false
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type Suspense = {}

export type Infinite = {
  /**
   * Specify the params key used for `pageParam`.
   * Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery`
   * @default `'id'`
   */
  queryParam: string
  /**
   * For v5
   * @default `0`
   */
  initialPageParam: number
}

export type Options = {
  output?: {
    /**
     * Output to save the @tanstack/query hooks.
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
   * Group the @tanstack/query hooks based on the provided name.
   */
  group?: {
    /**
     * Tag will group based on the operation tag inside the Swagger file
     */
    type: 'tag'
    /**
     * Relative path to save the grouped @tanstack/query hooks.
     *
     * `{{tag}}` will be replaced by the current tagName.
     * @example `${output}/{{tag}}Controller` => `hooks/PetController`
     * @default `${output}/{{tag}}Controller`
     */
    output?: string
    /**
     * Name to be used for the `export * as {{exportAs}} from './`
     * @default `"{{tag}}Hooks"`
     */
    exportAs?: string
  }
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
   * Framework to be generated for
   * @default 'react'
   */
  framework?: Framework
  /**
   * When set, an infiniteQuery hooks will be added.
   */
  infinite?: Partial<Infinite>
  /**
   * When set, a suspenseQuery hooks will be added.
   */
  suspense?: Suspense
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

export type Framework = 'react' | 'solid' | 'svelte' | 'vue'

type ResolvedOptions = {
  framework: NonNullable<PluginOptions['options']['framework']>
  clientImportPath: NonNullable<PluginOptions['options']['clientImportPath']>
  dataReturnType: NonNullable<PluginOptions['options']['dataReturnType']>
  /**
   * Only used of infinite
   */
  infinite: Infinite | undefined
  suspense: Suspense | undefined
  templates: NonNullable<Templates>
}

export type FileMeta = {
  pluginKey?: KubbPlugin['key']
  tag?: string
}
type AppMeta = SwaggerAppMeta
export type PluginOptions = PluginFactoryOptions<'swagger-tanstack-query', Options, ResolvedOptions, never, ResolvePathOptions, AppMeta>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger-tanstack-query']: PluginOptions
  }
}
