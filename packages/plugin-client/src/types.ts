import type { Visitor } from '@kubb/ast/types'
import type {
  CompatibilityPreset,
  Generator,
  Group,
  Output,
  PluginBaseOptions,
  PluginFactoryOptions,
  ResolvePathOptions,
  Resolver,
  UserGroup,
} from '@kubb/core'

/**
 * The concrete resolver type for `@kubb/plugin-client`.
 * Extends the base `Resolver` with a `resolveName` helper for client function names.
 */
export type ResolverClient = Resolver & {
  /**
   * Resolves the function name for a given raw operation name.
   * @example
   * resolver.resolveName('show pet by id') // -> 'showPetById'
   */
  resolveName(this: ResolverClient, name: string): string
}

/**
 * Use either a preset `client` type OR a custom `importPath`, not both.
 * `importPath` will override the default `client` preset when both are provided.
 * These options are mutually exclusive. `bundle` and `importPath` are also
 * mutually exclusive since `bundle` only has effect when `importPath` is not set.
 */
export type ClientImportPath =
  | {
      /**
       * Which client should be used to do the HTTP calls.
       * - 'axios' uses axios client for HTTP requests.
       * - 'fetch' uses native fetch API for HTTP requests.
       * @default 'axios'
       */
      client?: 'axios' | 'fetch'
      importPath?: never
    }
  | {
      client?: never
      /**
       * Client import path for API calls.
       * Used as `import client from '${importPath}'`.
       * Accepts relative and absolute paths; path changes are not performed.
       */
      importPath: string
      /**
       * `bundle` has no effect when `importPath` is set.
       * Use either `bundle` (with `client`) or `importPath`, not both.
       */
      bundle?: never
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

export type Options = PluginBaseOptions<ResolvedOptions> & {
  /**
   * Group the clients based on the provided name.
   */
  group?: UserGroup
  /**
   * Create `operations.ts` file with all operations grouped by methods.
   * @default false
   */
  operations?: boolean
  /**
   * Export urls that are used by operation x.
   * - 'export' makes them part of your barrel file.
   * - false does not make them exportable.
   * @default false
   * @example getGetPetByIdUrl
   */
  urlType?: 'export' | false
  /**
   * Allows you to set a custom base url for all generated calls.
   */
  baseURL?: string
  /**
   * ReturnType that is used when calling the client.
   * - 'data' returns ResponseConfig[data].
   * - 'full' returns ResponseConfig.
   * @default 'data'
   */
  dataReturnType?: 'data' | 'full'
  /**
   * How to style your params, by default no casing is applied.
   * - 'camelcase' uses camelCase for pathParams, queryParams and headerParams names
   * @note response types (data/body) are not affected by this option
   */
  paramsCasing?: 'camelcase'
  /**
   * Which parser can be used before returning the data.
   * - 'client' returns the data as-is from the client.
   * - 'zod' uses @kubb/plugin-zod to parse the data.
   * @default 'client'
   */
  parser?: 'client' | 'zod'
  /**
   * How to generate the client code.
   * - 'function' generates standalone functions for each operation.
   * - 'class' generates a class with methods for each operation.
   * - 'staticClass' generates a class with static methods for each operation.
   * @default 'function'
   */
  clientType?: 'function' | 'class' | 'staticClass'
  /**
   * Bundle the selected client into the generated `.kubb` directory.
   * When disabled the generated clients will import the shared runtime from `@kubb/plugin-client/clients/*`.
   * @default false
   * In version 5 of Kubb this is by default true
   */
  bundle?: boolean
  /**
   * Generate a wrapper class that composes all tag-based client classes into a single entry point.
   */
  wrapper?: {
    /**
     * Name of the wrapper class.
     */
    className: string
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
  resolver?: Partial<ResolverClient> & ThisType<ResolverClient>
  /**
   * Single AST visitor applied to each node before printing.
   * Return `null` or `undefined` from a method to leave the node unchanged.
   */
  transformer?: Visitor
  /**
   * Define some generators next to the client generators.
   */
  generators?: Array<Generator<PluginClient>>
} & ClientImportPath &
  ParamsTypeOptions

type ResolvedOptions = {
  output: Output
  group: Group | undefined
  client: Options['client']
  clientType: NonNullable<Options['clientType']>
  bundle: NonNullable<Options['bundle']>
  parser: NonNullable<Options['parser']>
  urlType: NonNullable<Options['urlType']>
  importPath: Options['importPath']
  baseURL: Options['baseURL']
  dataReturnType: NonNullable<Options['dataReturnType']>
  pathParamsType: NonNullable<NonNullable<Options['pathParamsType']>>
  paramsType: NonNullable<Options['paramsType']>
  paramsCasing: Options['paramsCasing']
  wrapper: Options['wrapper']
  resolver: ResolverClient
}

export type PluginClient = PluginFactoryOptions<'plugin-client', Options, ResolvedOptions, never, ResolvePathOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-client': PluginClient
    }
  }
}
