import { pascalCase } from '@internals/utils'
import { createTransformer } from '@kubb/core'
import type { PluginTs } from './types.ts'

/**
 * The concrete transformer type for `@kubb/plugin-ts`.
 * Defines the exact helper methods provided by the plugin.
 */
export type PluginTsTransformer = {
  /**
   * Converts a raw name into the PascalCase identifier used by plugin-ts.
   *
   * @example
   * transformer.default('list pets', 'type') // → 'ListPets'
   */
  default(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
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
 * transformer.resolvePathName('list pets', 'file') // → 'ListPets'
 * ```
 */
export const transformer: PluginTsTransformer = createTransformer<PluginTs>(() => {
  return {
    default: resolveName,
    resolvePathName: resolveName,
  }
})
