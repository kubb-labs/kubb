import { pascalCase } from '@internals/utils'
import { createTransformer } from '@kubb/core'
import type { PluginTs, PluginTsTransformer } from './types.ts'
export type { PluginTsTransformer } from './types.ts'

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
    name(name) {
      return this.default(name, 'function')
    },
    typedName(name) {
      return this.default(name, 'type')
    },
    resolvePathName(name, type) {
      return this.default(name, type)
    },
  }
})()
