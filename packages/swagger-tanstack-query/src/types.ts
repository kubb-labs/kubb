import type { PluginFactoryOptions } from '@kubb/core'
import type { Operation, OverrideBy, ResolvePathOptions, SkipBy, AppMeta as SwaggerAppMeta } from '@kubb/swagger'

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
  skipBy?: Array<SkipBy>
  overrideBy?: Array<OverrideBy<Options>>
  /**
   * Framework to be generated for
   * @default 'react'
   */
  framework?: Framework
  infinite?: {
    /**
     * Specify the params key used for `pageParam`.
     * Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery`
     * @default `'id'`
     */
    queryParam?: string
  }
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
    QueryOptions: string
    /*
     * v5
     */
    queryOptions?: string
    //infinite
    UseInfiniteQueryOptions: string
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

export type PluginOptions = PluginFactoryOptions<'swagger-tanstack-query', Options, false, undefined, ResolvePathOptions>

export type AppMeta = SwaggerAppMeta
