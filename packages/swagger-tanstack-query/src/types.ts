import type { PluginFactoryOptions } from '@kubb/core'
import type { Operation, SkipBy } from '@kubb/swagger'

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
   * Framework to be generated for
   * @default 'react'
   */
  skipBy?: SkipBy[]
  framework?: Framework
  infinite?: {
    /**
     * Specify the params key used for `pageParam`.
     * Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery`
     * @default `'id'`
     */
    queryParam?: string
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
  tag: string
}

export type ResolvePathOptions = { tag?: string }

export type PluginOptions = PluginFactoryOptions<'swagger-tanstack-query', Options, false, undefined, ResolvePathOptions>
