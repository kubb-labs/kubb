import type { PluginFactoryOptions } from '@kubb/core'
import type { AppMeta as SwaggerAppMeta, Operation, OverrideBy, ResolvePathOptions, SkipBy } from '@kubb/swagger'

type Infinite = {
  /**
   * Specify the params key used for `pageParam`.
   * Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery`
   * @default `'id'`
   */
  queryParam?: string
  /**
   * For v5
   */
  initialPageParam?: number
}

export type Options = {
  /**
   * Output to save the @tanstack/query hooks.
   * @default `"hooks"`
   */
  output?: string
  /**
   * Group the @tanstack/query hooks based on the provided name.
   */
  groupBy?: {
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
  client?: string
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
   * Array containing skipBy paramaters to exclude/skip tags/operations/methods/paths.
   */
  skipBy?: Array<SkipBy>
  /**
   * Array containing overrideBy paramaters to override `options` based on tags/operations/methods/paths.
   */
  overrideBy?: Array<OverrideBy<Options>>
  /**
   * Framework to be generated for
   * @default 'react'
   */
  framework?: Framework
  /**
   * When set, an infiniteQuery hooks will be added.
   */
  infinite?: Infinite
  transformers?: {
    /**
     * Override the name of the hook that is getting generated, this will also override the name of the file.
     */
    name?: (name: string) => string
  }
}

export type Framework = 'react' | 'solid' | 'svelte' | 'vue'

export type FrameworkImports = {
  getName: (operation: Operation) => string
  query: {
    useQuery: string
    QueryKey: string
    UseQueryResult: string
    UseQueryOptions: string
    /**
     * v5 only
     */
    queryOptions?: string
    /**
     * v5 only
     */
    QueryObserverOptions?: string
    /**
     * Infinte
     */
    UseInfiniteQueryOptions: string
    /**
     * v5 only
     */
    InfiniteQueryObserverOptions?: string
    /**
     * v5 only
     */
    infiniteQueryOptions?: string
    /**
     * v5 only
     */
    InfiniteData?: string
    UseInfiniteQueryResult: string
    useInfiniteQuery: string
  }
  mutate: {
    useMutation: string
    UseMutationOptions: string
    UseMutationResult: string
  }
}

export type FileMeta = {
  pluginName?: string
  tag?: string
}

export type PluginOptions = PluginFactoryOptions<'swagger-tanstack-query', Options, false, never, ResolvePathOptions>

export type AppMeta = SwaggerAppMeta
