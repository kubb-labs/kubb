import type { Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'

import type { HttpMethod } from '@kubb/oas'
import type { Exclude, Generator, Include, Override, ResolvePathOptions } from '@kubb/plugin-oas'

type Query = {
  /**
   * Customize the queryKey, here you can specify a suffix.
   */
  key: (key: unknown[]) => unknown[]
  /**
   * Define which HttpMethods can be used for queries
   * @default ['get']
   */
  methods: Array<HttpMethod>
  /**
   * Path to the useQuery that will be used to do the useQuery functionality.
   * It will be used as `import { useQuery } from '${importPath}'`.
   * It allows both relative and absolute path.
   * the path will be applied as is, so relative path should be based on the file being generated.
   * @default '@tanstack/react-query'
   */
  importPath?: string
}

type Mutation = {
  /**
   * Customize the queryKey, here you can specify a suffix.
   */
  key: (key: unknown[]) => unknown[]
  /**
   * Define which HttpMethods can be used for mutations
   * @default ['post', 'put', 'delete']
   */
  methods: Array<HttpMethod>
  /**
   * Path to the useQuery that will be used to do the useQuery functionality.
   * It will be used as `import { useQuery } from '${importPath}'`.
   * It allows both relative and absolute path.
   * the path will be applied as is, so relative path should be based on the file being generated.
   * @default '@tanstack/react-query'
   */
  importPath?: string
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
  /**
   * @default 'hooks'
   */
  output?: Output
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
   * When set, an infiniteQuery hooks will be added.
   */
  infinite?: Partial<Infinite> | false
  /**
   * Override some useQuery behaviours.
   */
  query?: Partial<Query> | false
  /**
   * Override some useMutation behaviours.
   */
  mutation?: Mutation | false
  /**
   * Which parser can be used before returning the data to `@tanstack/query`.
   * `'zod'` will use `@kubb/plugin-zod` to parse the data.
   */
  parser?: 'client' | 'zod'
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  /**
   * Define some generators next to the vue-query generators
   */
  generators?: Array<Generator<PluginVueQuery>>
}

type ResolvedOptions = {
  output: Output
  baseURL: string | undefined
  client: Required<NonNullable<PluginVueQuery['options']['client']>>
  parser: Required<NonNullable<Options['parser']>>
  pathParamsType: NonNullable<Options['pathParamsType']>
  /**
   * Only used of infinite
   */
  infinite: NonNullable<Infinite> | false
  query: NonNullable<Required<Query>> | false
  mutation: NonNullable<Required<Mutation>> | false
}

export type PluginVueQuery = PluginFactoryOptions<'plugin-vue-query', Options, ResolvedOptions, never, ResolvePathOptions>
