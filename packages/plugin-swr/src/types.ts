import type { OperationNode, Visitor } from '@kubb/ast/types'
import type {
  CompatibilityPreset,
  Exclude,
  Generator,
  Group,
  Include,
  Output,
  Override,
  PluginFactoryOptions,
  ResolvePathOptions,
  Resolver,
  UserGroup,
} from '@kubb/core'
import type { ClientImportPath, PluginClient } from '@kubb/plugin-client'

/**
 * Customizes how queryKey or mutationKey arrays are built.
 */
export type Transformer = (props: { node: OperationNode; casing: 'camelcase' | undefined }) => unknown[]

/**
 * The concrete resolver type for `@kubb/plugin-swr`.
 * Extends the base `Resolver` with a `resolveName` helper for hook function names.
 */
export type ResolverSwr = Resolver & {
  /**
   * Resolves the hook function name for a given raw operation name.
   * @example
   * resolver.resolveName('show pet by id') // -> 'showPetById'
   */
  resolveName(this: ResolverSwr, name: string): string
}

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
  methods?: Array<string>
  /**
   * Path to the useQuery hook for useQuery functionality.
   * Used as `import { useQuery } from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default 'swr'
   */
  importPath?: string
}

type Mutation = {
  /**
   * Define which HttpMethods can be used for queries
   * @default ['post', 'put', 'delete', 'patch']
   */
  methods?: Array<string>
  /**
   * Path to the useQuery hook for useQuery functionality.
   * Used as `import { useQuery } from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default 'swr/mutation'
   */
  importPath?: string
  /**
   * When true, mutation parameters (path params, query params, headers, body) is passed via `trigger()` instead of as hook arguments.
   * This aligns with React Query's mutation pattern where variables are passed when triggering the mutation.
   * @default false
   * @deprecated This will become the default behavior in v5. Set to `true` to opt-in early.
   */
  paramsToTrigger?: boolean
}

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'hooks', barrelType: 'named' }
   */
  output?: Output
  /**
   * Group the SWR hooks based on the provided name.
   */
  group?: UserGroup
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
  client?: ClientImportPath & Pick<PluginClient['options'], 'clientType' | 'dataReturnType' | 'baseURL' | 'bundle' | 'paramsCasing'>
  queryKey?: QueryKey
  query?: Query | false
  mutationKey?: MutationKey
  mutation?: Mutation | false
  /**
   * How to style your params, by default no casing is applied
   * - 'camelcase' uses camelcase for the params names
   */
  paramsCasing?: 'camelcase'
  /**
   * How to pass your params
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
   * Which parser should be used before returning the data to `swr`.
   * `'zod'` uses `@kubb/plugin-zod` to parse the data.
   */
  parser?: PluginClient['options']['parser']
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: string, type?: string) => string
  }
  /**
   * Apply a compatibility naming preset.
   * @default 'default'
   */
  compatibilityPreset?: CompatibilityPreset
  /**
   * Override individual resolver methods. Any method you omit falls back to the
   * preset resolver's implementation. Use `this.default(...)` to call it.
   */
  resolver?: Partial<ResolverSwr> & ThisType<ResolverSwr>
  /**
   * Single AST visitor applied to each node before printing.
   * Return `null` or `undefined` from a method to leave the node unchanged.
   */
  transformer?: Visitor
  /**
   * Define some generators next to the swr generators
   */
  generators?: Array<Generator<PluginSwr>>
}

type ResolvedOptions = {
  output: Output
  client: Pick<PluginClient['options'], 'client' | 'clientType' | 'dataReturnType' | 'importPath' | 'baseURL' | 'bundle' | 'paramsCasing'>
  parser: Required<NonNullable<Options['parser']>>
  queryKey: QueryKey | undefined
  query: NonNullable<Required<Query>> | false
  mutationKey: MutationKey | undefined
  mutation: (Required<Pick<Mutation, 'methods' | 'importPath'>> & Pick<Mutation, 'paramsToTrigger'>) | false
  paramsCasing: Options['paramsCasing']
  paramsType: NonNullable<Options['paramsType']>
  pathParamsType: NonNullable<Options['pathParamsType']>
  transformers: NonNullable<Options['transformers']>
  group: Group | undefined
  exclude: NonNullable<Options['exclude']>
  include: Options['include']
  override: NonNullable<Options['override']>
  resolver: ResolverSwr
}

export type PluginSwr = PluginFactoryOptions<'plugin-swr', Options, ResolvedOptions, never, ResolvePathOptions, ResolverSwr>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-swr': PluginSwr
    }
  }
}
