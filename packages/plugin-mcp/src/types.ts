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
import type { ClientImportPath, PluginClient } from '@kubb/plugin-client'

/**
 * The concrete resolver type for `@kubb/plugin-mcp`.
 * Extends the base `Resolver` with a `resolveName` helper for MCP handler function names.
 */
export type ResolverMcp = Resolver & {
  /**
   * Resolves the handler function name for a given raw operation name.
   * @example
   * resolver.resolveName('show pet by id') // -> 'showPetByIdHandler'
   */
  resolveName(this: ResolverMcp, name: string): string
}

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output.
   * @default { path: 'mcp', barrelType: 'named' }
   */
  output?: Output
  /**
   * Client configuration for HTTP request generation.
   */
  client?: ClientImportPath & Pick<PluginClient['options'], 'clientType' | 'dataReturnType' | 'baseURL' | 'bundle' | 'paramsCasing'>
  /**
   * Transform parameter names to a specific casing format.
   * When set to 'camelcase', parameter names in path, query, and header params will be transformed to camelCase.
   * This should match the paramsCasing setting used in @kubb/plugin-ts.
   * @default undefined
   */
  paramsCasing?: 'camelcase'
  /**
   * Group the MCP requests based on the provided name.
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
  resolver?: Partial<ResolverMcp> & ThisType<ResolverMcp>
  /**
   * A single AST visitor applied before printing.
   * When a visitor method returns `null` or `undefined`, the preset transformer's result is used instead.
   */
  transformer?: Visitor
  /**
   * Define some generators next to the default MCP generators.
   */
  generators?: Array<Generator<PluginMcp>>
}

type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | undefined
  client: Pick<PluginClient['options'], 'client' | 'clientType' | 'dataReturnType' | 'importPath' | 'baseURL' | 'bundle' | 'paramsCasing'>
  paramsCasing: Options['paramsCasing']
  resolver: ResolverMcp
}

export type PluginMcp = PluginFactoryOptions<'plugin-mcp', Options, ResolvedOptions, never, ResolvePathOptions, ResolverMcp>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-mcp': PluginMcp
    }
  }
}
