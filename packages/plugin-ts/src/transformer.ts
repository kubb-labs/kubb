import { pascalCase } from '@internals/utils'
import { createTransformer } from '@kubb/core'
import type { PluginTs } from './types.ts'

/**
 * The concrete transformer type for `@kubb/plugin-ts`.
 * Defines the exact helper methods provided by the plugin.
 */
export type PluginTsTransformer = {
  /**
   * Converts a raw name using the plugin's default naming convention (PascalCase).
   * The optional `type` discriminant lets the caller signal the role of the name
   * (e.g. `'type'`, `'function'`, `'file'`, `'const'`).
   *
   * @example
   * transformer.default('list pets', 'type') // → 'ListPets'
   */
  default(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
  /**
   * Resolves the variable/function name for a given raw name (equivalent to `default(name, 'function')`).
   * Use this shorthand when matching the `name` field produced by the v2 TypeGenerator,
   * so call-sites don't need to repeat the `'function'` type literal.
   *
   * @example
   * transformer.name('list pets status 200') // → 'ListPetsStatus200'
   */
  name(name: string): string
  /**
   * Resolves the TypeScript type name for a given raw name (equivalent to `default(name, 'type')`).
   * Use this shorthand when matching the `typedName` field produced by the v2 TypeGenerator,
   * so call-sites don't need to repeat the `'type'` type literal.
   *
   * @example
   * transformer.typedName('list pets status 200') // → 'ListPetsStatus200'
   */
  typedName(name: string): string
  /**
   * Resolves the file/path name for a given identifier using PascalCase.
   *
   * @example
   * transformer.resolvePathName('list pets', 'file') // → 'ListPets'
   */
  resolvePathName(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
}

function resolveName(name: string, type?: 'file' | 'function' | 'type' | 'const'): string {
  return pascalCase(name, { isFile: type === 'file' })
}

/**
 * Transformer for `@kubb/plugin-ts` that provides the default naming and path-resolution
 * helpers used by the plugin. Import this in other plugins to resolve the exact names and
 * paths that `plugin-ts` generates without hardcoding the conventions.
 *
 * @example
 * ```ts
 * import { transformer } from '@kubb/plugin-ts'
 *
 * transformer.default('list pets', 'type')         // → 'ListPets'
 * transformer.name('list pets status 200')         // → 'ListPetsStatus200'
 * transformer.typedName('list pets status 200')    // → 'ListPetsStatus200'
 * transformer.resolvePathName('list pets', 'file') // → 'ListPets'
 * ```
 */
export const transformer: PluginTsTransformer = createTransformer<PluginTs>(() => {
  return {
    default: resolveName,
    name: (name) => resolveName(name, 'function'),
    typedName: (name) => resolveName(name, 'type'),
    resolvePathName: resolveName,
  }
})
