import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'

import type { HttpMethod, Operation } from '@kubb/oas'
import type { PluginClient } from '@kubb/plugin-client'
import type { Exclude, Generator, Include, OperationSchemas, Override, ResolvePathOptions } from '@kubb/plugin-oas'
import type { PluginReactQuery } from '@kubb/plugin-react-query'

type TransformerProps = {
  operation: Operation
  schemas: OperationSchemas
  casing: 'camelcase' | undefined
}

export type Transformer = (props: TransformerProps) => unknown[]

/**
 * Customize the queryKey
 */
type QueryKey = Transformer

/**
 * Customize the mutationKey
 */
type MutationKey = Transformer

type Query = {
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
   * @default '@tanstack/svelte-query'
   */
  importPath?: string
}

type Mutation = {
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
   * @default '@tanstack/svelte-query'
   */
  importPath?: string
}

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'hooks', barrelType: 'named' }
   */
  output?: Output
  /**
   * Group the @tanstack/query hooks based on the provided name.
   */
  group?: Group

  client?: Pick<PluginClient['options'], 'dataReturnType' | 'importPath' | 'baseURL'>

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
   * How to style your params, by default no casing is applied
   * - 'camelcase' will use camelcase for the params names
   */
  paramsCasing?: 'camelcase'
  /**
   * How to pass your params
   * - 'object' will return the params and pathParams as an object.
   * - 'inline' will return the params as comma separated params.
   * @default 'inline'
   */
  paramsType?: 'object' | 'inline'
  /**
   * How to pass your pathParams.
   * - 'object' will return the pathParams as an object.
   * - 'inline' will return the pathParams as comma separated params.
   * @default 'inline'
   */
  pathParamsType?: PluginClient['options']['pathParamsType']
  queryKey?: QueryKey
  /**
   * Override some useQuery behaviours.
   */
  query?: Partial<Query> | false
  mutationKey?: MutationKey
  /**
   * Override some useMutation behaviours.
   */
  mutation?: Mutation | false
  /**
   * Which parser should be used before returning the data to `@tanstack/query`.
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
   * Define some generators next to the svelte-query generators
   */
  generators?: Array<Generator<PluginSvelteQuery>>
}

type ResolvedOptions = {
  output: Output
  group: Options['group']
  client: Required<Omit<NonNullable<PluginReactQuery['options']['client']>, 'baseURL'>> & { baseURL?: string }
  parser: Required<NonNullable<Options['parser']>>
  paramsCasing: Options['paramsCasing']
  paramsType: NonNullable<Options['paramsType']>
  pathParamsType: NonNullable<Options['pathParamsType']>
  queryKey: QueryKey | undefined
  query: NonNullable<Required<Query>> | false
  mutationKey: MutationKey | undefined
  mutation: NonNullable<Required<Mutation>> | false
}

export type PluginSvelteQuery = PluginFactoryOptions<'plugin-svelte-query', Options, ResolvedOptions, never, ResolvePathOptions>
