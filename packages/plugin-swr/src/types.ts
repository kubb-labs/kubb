import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import type { PluginClient } from '@kubb/plugin-client'
import type { Exclude, Generator, Include, Override, ResolvePathOptions } from '@kubb/plugin-oas'

export type Options = {
  /**
   * @default 'hooks'
   */
  output?: Output
  /**
   * Group the SWR hooks based on the provided name.
   */
  group?: Group
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
  client?: Pick<PluginClient['options'], 'dataReturnType' | 'importPath'>
  query?: {
    /**
     * Customize the queryKey, here you can specify a suffix.
     */
    key: (key: unknown[]) => unknown[]
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
     * Customize the queryKey, here you can specify a suffix.
     */
    key: (key: unknown[]) => unknown[]
    /**
     * Define which HttpMethods can be used for queries
     * @default ['post', 'put', 'delete', 'patch']
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
  /**
   * How to pass your pathParams.
   *
   * `object` will return the pathParams as an object.
   *
   * `inline` will return the pathParams as comma separated params.
   * @default `'inline'`
   * @private
   */
  pathParamsType?: PluginClient['options']['pathParamsType']
  /**
   * Which parser can be used before returning the data to `swr`.
   * `'zod'` will use `@kubb/plugin-zod` to parse the data.
   */
  parser?: PluginClient['options']['parser']
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  /**
   * Define some generators next to the swr generators
   */
  generators?: Array<Generator<PluginSwr>>
}

type ResolvedOptions = {
  output: Output
  baseURL: string | undefined
  client: Required<NonNullable<Options['client']>>
  parser: Required<NonNullable<Options['parser']>>
  mutation: Required<NonNullable<Options['mutation']>>
  query: Required<NonNullable<Options['query']>>
  pathParamsType: NonNullable<Options['pathParamsType']>
}

export type PluginSwr = PluginFactoryOptions<'plugin-swr', Options, ResolvedOptions, never, ResolvePathOptions>
