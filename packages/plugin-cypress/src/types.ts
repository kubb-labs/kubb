import type { Visitor } from '@kubb/ast/types'
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

/**
 * The concrete resolver type for `@kubb/plugin-cypress`.
 * Extends the base `Resolver` with a `resolveName` helper for operation function names.
 */
export type ResolverCypress = Resolver & {
  /**
   * Resolves the function name for a given raw operation name.
   * @example
   * resolver.resolveName('show pet by id') // -> 'showPetById'
   */
  resolveName(name: string): string
}

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output.
   * @default { path: 'cypress', barrelType: 'named' }
   */
  output?: Output
  /**
   * Return type when calling cy.request.
   * - 'data' returns ResponseConfig[data].
   * - 'full' returns ResponseConfig.
   * @default 'data'
   */
  dataReturnType?: 'data' | 'full'
  /**
   * How to style your params, by default no casing is applied.
   * - 'camelcase' uses camelCase for the params names.
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
   * - 'inline' returns the pathParams as comma separated params.
   * @default 'inline'
   */
  pathParamsType?: 'object' | 'inline'
  /**
   * Base URL prepended to every generated request URL.
   */
  baseURL?: string
  /**
   * Group the Cypress requests based on the provided name.
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
  /**
   * Apply a compatibility naming preset.
   * @default 'default'
   */
  compatibilityPreset?: CompatibilityPreset
  /**
   * Array of named resolvers that control naming conventions.
   * Later entries override earlier ones (last wins).
   * @default [resolverCypress]
   */
  resolvers?: Array<ResolverCypress>
  /**
   * Array of AST visitors applied to each node before printing.
   * Uses `transform()` from `@kubb/ast`.
   */
  transformers?: Array<Visitor>
  /**
   * Define some generators next to the default generators.
   */
  generators?: Array<Generator<PluginCypress>>
}

type ResolvedOptions = {
  output: Output
  group: Group | undefined
  baseURL: Options['baseURL'] | undefined
  dataReturnType: NonNullable<Options['dataReturnType']>
  pathParamsType: NonNullable<Options['pathParamsType']>
  paramsType: NonNullable<Options['paramsType']>
  paramsCasing: Options['paramsCasing']
  resolver: ResolverCypress
  transformers: Array<Visitor>
}

export type PluginCypress = PluginFactoryOptions<'plugin-cypress', Options, ResolvedOptions, never, ResolvePathOptions, ResolverCypress>
