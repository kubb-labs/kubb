import { pascalCase } from '@internals/utils'
import { createTransformer } from '@kubb/core'
import type { Transformer } from '@kubb/core'
import type { PluginTs } from './types.ts'

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
export const transformer: Transformer = createTransformer<PluginTs>(() => {
  return {
    default: resolveName,
    resolvePathName: resolveName,
  }
})
