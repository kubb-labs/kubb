import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'

import type { contentType, HttpMethod, Oas, Operation } from '@kubb/oas'
import type { PluginClient } from '@kubb/plugin-client'
import type { Exclude, Include, OperationSchemas, Override, ResolvePathOptions } from '@kubb/plugin-oas'
import type { Generator } from '@kubb/plugin-oas/generators'

type TransformerProps = {
  operation: Operation
  schemas: OperationSchemas
  casing: 'camelcase' | undefined
}

export type Transformer = (props: TransformerProps) => unknown[]

type Suspense = object

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
   * Path to the useQuery hook for useQuery functionality.
   * Used as `import { useQuery } from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default '@tanstack/react-query'
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
   * Path to the useQuery hook for useQuery functionality.
   * Used as `import { useQuery } from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default '@tanstack/react-query'
   */
  importPath?: string
}

export type Infinite = {
  /**
   * Specify the params key used for `pageParam`.
   * @default 'id'
   */
  queryParam: string
  /**
   * Which field of the data is used, set it to undefined when no cursor is known.
   * @deprecated Use `nextParam` and `previousParam` instead for more flexible pagination handling.
   */
  cursorParam?: string | undefined
  /**
   * Which field of the data is used to get the cursor for the next page.
   * Supports dot notation (e.g. 'pagination.next.id') or array path (e.g. ['pagination', 'next', 'id']) to access nested fields.
   */
  nextParam?: string | string[] | undefined
  /**
   * Which field of the data is used to get the cursor for the previous page.
   * Supports dot notation (e.g. 'pagination.prev.id') or array path (e.g. ['pagination', 'prev', 'id']) to access nested fields.
   */
  previousParam?: string | string[] | undefined
  /**
   * The initial value, the value of the first page.
   * @default 0
   */
  initialPageParam: unknown
}

type CustomOptions = {
  /**
   * Path to the hook that is used to customize the hook options.
   * It used as `import ${customOptions.name} from '${customOptions.importPath}'`.
   * It allows both relative and absolute paths but be aware that we will not change the path.
   */
  importPath: string
  /**
   * Name of the exported hook that is used to customize the hook options.
   * It used as `import ${customOptions.name} from '${customOptions.importPath}'`.
   * @default 'useCustomHookOptions'
   */
  name?: string
}

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'hooks', barrelType: 'named' }
   */
  output?: Output<Oas>
  /**
   * Define which contentType should be used.
   * By default, the first JSON valid mediaType is used
   */
  contentType?: contentType
  /**
   * Group the @tanstack/query hooks based on the provided name.
   */
  group?: Group
  client?: Pick<PluginClient['options'], 'client' | 'clientType' | 'dataReturnType' | 'importPath' | 'baseURL' | 'bundle'>
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
   * - 'camelcase' uses camelcase for the params names
   */
  paramsCasing?: 'camelcase'
  /**
   * How to pass your params.
   * - 'object' returns the params and pathParams as an object.
   * - 'inline' returns the params as comma separated params.
   * @default 'inline'
   */
  paramsType?: 'object' | 'inline'
  /**
   * How to pass your pathParams.
   * - 'object' returns the pathParams as an object.
   * - 'inline': returns the pathParams as comma separated params.
   * @default 'inline'
   */
  pathParamsType?: PluginClient['options']['pathParamsType']

  /**
   * When set, an infiniteQuery hooks is added.
   */
  infinite?: Partial<Infinite> | false
  /**
   * When set, a suspenseQuery hooks is added.
   */
  suspense?: Partial<Suspense> | false
  queryKey?: QueryKey
  /**
   * Override some useQuery behaviors.
   */
  query?: Partial<Query> | false
  mutationKey?: MutationKey
  /**
   * Override some useMutation behaviors.
   */
  mutation?: Partial<Mutation> | false
  /**
   * When set, a custom hook is used to customize the options of the generated hooks.
   * It will also generate a `HookOptions` type that can be used to type the custom options of each hook for type-safety.
   */
  customOptions?: CustomOptions
  /**
   * Which parser should be used before returning the data to `@tanstack/query`.
   * `'zod'` uses `@kubb/plugin-zod` to parse the data.
   */
  parser?: PluginClient['options']['parser']
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  /**
   * Define some generators next to the react-query generators
   */
  generators?: Array<Generator<PluginReactQuery>>
}

type ResolvedOptions = {
  output: Output<Oas>
  group: Options['group']
  client: NonNullable<PluginReactQuery['options']['client']>
  parser: Required<NonNullable<Options['parser']>>
  pathParamsType: NonNullable<Options['pathParamsType']>
  paramsCasing: Options['paramsCasing']
  paramsType: NonNullable<Options['paramsType']>
  /**
   * Only used of infinite
   */
  infinite: NonNullable<Infinite> | false
  suspense: Suspense | false
  queryKey: QueryKey | undefined
  query: NonNullable<Required<Query>> | false
  mutationKey: MutationKey | undefined
  mutation: NonNullable<Required<Mutation>> | false
  customOptions: NonNullable<Required<CustomOptions>> | undefined
}

export type PluginReactQuery = PluginFactoryOptions<'plugin-react-query', Options, ResolvedOptions, never, ResolvePathOptions>
