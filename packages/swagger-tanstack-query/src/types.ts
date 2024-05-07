import type { KubbFile, Plugin, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import type { Exclude, Include, Override, ResolvePathOptions } from '@kubb/swagger'
import type { Mutation } from './components/Mutation.tsx'
import type { Operations } from './components/Operations.tsx'
import type { Query as QueryTemplate } from './components/Query.tsx'
import type { QueryKey } from './components/QueryKey.tsx'
import type { QueryOptions as QueryOptionsTemplate } from './components/QueryOptions.tsx'
import type { QueryImports } from './components/QueryImports.tsx'

type Templates = {
  operations?: typeof Operations.templates | false
  mutation?: typeof Mutation.templates | false
  query?: typeof QueryTemplate.templates | false
  queryOptions?: typeof QueryOptionsTemplate.templates | false
  queryKey?: typeof QueryKey.templates | false
  queryImports?: typeof QueryImports.templates | false
}

export type Suspense = object

export type Query = {
  /**
   * Customize the queryKey, here you can specify a suffix.
   */
  queryKey: (key: unknown[]) => unknown[]
  /**
   * Define which HttpMethods can be used for queries
   * @default ['get']
   */
  methods: Array<HttpMethod>
  /**
   * Path to the useQuery that will be used to do the useQuery functionality.
   * It will be used as `import { useQuery } from '${hook.importPath}'`.
   * It allows both relative and absolute path.
   * the path will be applied as is, so relative path should be based on the file being generated.
   * @default '@tanstack/react-query' if 'framework' is set to 'react'
   */
  importPath?: string
}

export type QueryOptions = object

export type Mutate = {
  /**
   * Define the way of passing through the queryParams, headerParams and data.
   * @default `'hook'`
   */
  variablesType: 'mutate' | 'hook'
  /**
   * Define which HttpMethods can be used for mutations
   * @default ['post', 'put', 'delete']
   */
  methods: Array<HttpMethod>
}

export type Infinite = {
  /**
   * Specify the params key used for `pageParam`.
   * Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery`
   * @default `'id'`
   */
  queryParam: string
  /**
   * Which field of the data will be used, set it to undefined when no cursor is known.
   */
  cursorParam?: string | undefined
  /**
   * The initial value, the value of the first page.
   * @default `0`
   */
  initialPageParam: unknown
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
    exportType?: 'barrel' | 'barrelNamed' | false
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

  client?: {
    /**
     * Path to the client that will be used to do the API calls.
     * It will be used as `import client from '${client.importPath}'`.
     * It allows both relative and absolute path.
     * the path will be applied as is, so relative path should be based on the file being generated.
     * @default '@kubb/swagger-client/client'
     */
    importPath?: string
  }
  /**
   * ReturnType that needs to be used when calling client().
   *
   * `Data` will return ResponseConfig[data].
   *
   * `Full` will return ResponseConfig.
   * @default `'data'`
   * @private
   */
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
  /**
   * Which parser can be used before returning the data to `@tanstack/query`.
   * `'zod'` will use `@kubb/swagger-zod` to parse the data.
   */
  parser?: 'zod'
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
  /**
   * Framework to be generated for
   * @default 'react'
   */
  framework?: Framework
  /**
   * When set, an infiniteQuery hooks will be added.
   */
  infinite?: Partial<Infinite> | false
  /**
   * When set, a suspenseQuery hooks will be added.
   */
  suspense?: Partial<Suspense> | false
  /**
   * Override some useQuery behaviours.
   */
  query?: Partial<Query> | false
  queryOptions?: Partial<QueryOptions> | false
  /**
   * Override some useMutation behaviours.
   */
  mutate?: Mutate | false
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
  framework: NonNullable<PluginTanstackQuery['options']['framework']>
  client: Required<NonNullable<PluginTanstackQuery['options']['client']>>
  dataReturnType: NonNullable<PluginTanstackQuery['options']['dataReturnType']>
  pathParamsType: NonNullable<PluginTanstackQuery['options']['pathParamsType']>
  parser: PluginTanstackQuery['options']['parser']
  /**
   * Only used of infinite
   */
  infinite: Infinite | false
  suspense: Suspense | false
  query: Query | false
  queryOptions: QueryOptions | false
  mutate: Mutate | false
  templates: NonNullable<Templates>
}

export type FileMeta = {
  pluginKey?: Plugin['key']
  tag?: string
}

export type PluginTanstackQuery = PluginFactoryOptions<'plugin-tanstack-query', Options, ResolvedOptions, never, ResolvePathOptions>

declare module '@kubb/core' {
  export interface _Register {
    ['@kubb/swagger-tanstack-query']: PluginTanstackQuery
  }
}
