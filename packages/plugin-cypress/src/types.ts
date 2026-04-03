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
  resolveName(this: ResolverCypress, name: string): string
}

/**
 * Discriminated union that ties `pathParamsType` to the `paramsType` values where it is meaningful.
 *
 * - `paramsType: 'object'` — all parameters (including path params) are merged into a single
 *   destructured object. `pathParamsType` is never reached in this code path and has no effect.
 * - `paramsType?: 'inline'` (or omitted) — each parameter group is a separate function argument.
 *   `pathParamsType` controls whether the path-param group itself is destructured (`'object'`)
 *   or spread as individual arguments (`'inline'`).
 */
type ParamsTypeOptions =
  | {
      /**
       * All parameters — path, query, headers, and body — are merged into a single
       * destructured object argument.
       * - 'object' returns the params and pathParams as an object.
       * @default 'inline'
       */
      paramsType: 'object'
      /**
       * `pathParamsType` has no effect when `paramsType` is `'object'`.
       * Path params are already inside the single destructured object.
       */
      pathParamsType?: never
    }
  | {
      /**
       * Each parameter group is emitted as a separate function argument.
       * - 'inline' returns the params as comma separated params.
       * @default 'inline'
       */
      paramsType?: 'inline'
      /**
       * Controls how path parameters are arranged within the inline argument list.
       * - 'object' groups path params into a destructured object: `{ petId }: PathParams`.
       * - 'inline' emits each path param as its own argument: `petId: string`.
       * @default 'inline'
       */
      pathParamsType?: 'object' | 'inline'
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
   * A single resolver whose methods override the default resolver's naming conventions.
   * When a method returns `null` or `undefined`, the default resolver's result is used instead.
   */
  resolver?: Partial<ResolverCypress> & ThisType<ResolverCypress>
  /**
   * A single AST visitor applied before printing.
   * When a visitor method returns `null` or `undefined`, the preset transformer's result is used instead.
   */
  transformer?: Visitor
  /**
   * Define some generators next to the default generators.
   */
  generators?: Array<Generator<PluginCypress>>
} & ParamsTypeOptions

type ResolvedOptions = {
  output: Output
  group: Group | undefined
  baseURL: Options['baseURL'] | undefined
  dataReturnType: NonNullable<Options['dataReturnType']>
  pathParamsType: NonNullable<NonNullable<Options['pathParamsType']>>
  paramsType: NonNullable<Options['paramsType']>
  paramsCasing: Options['paramsCasing']
  resolver: ResolverCypress
}

export type PluginCypress = PluginFactoryOptions<'plugin-cypress', Options, ResolvedOptions, never, ResolvePathOptions, ResolverCypress>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-cypress': PluginCypress
    }
  }
}
