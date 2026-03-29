import { camelCase, pascalCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginZod } from '../types.ts'

function resolveName(name: string, type?: 'file' | 'function' | 'type' | 'const'): string {
  const resolved = camelCase(name, {
    suffix: type ? 'schema' : undefined,
    isFile: type === 'file',
  })

  if (type === 'type') {
    return pascalCase(resolved)
  }

  return resolved
}

/**
 * Default resolver for `@kubb/plugin-zod`.
 *
 * Uses `camelCase` naming with a `Schema` suffix for function/type/const names.
 *
 * @example
 * ```ts
 * resolverZod.default('list pets', 'function') // → 'listPetsSchema'
 * resolverZod.default('Pet', 'file')           // → 'pet'
 * resolverZod.resolveName('list pets')          // → 'listPetsSchema'
 * ```
 */
export const resolverZod = defineResolver<PluginZod>(() => {
  return {
    name: 'default',
    pluginName: 'plugin-zod',
    default(name, type) {
      return resolveName(name, type)
    },
    resolveName(name) {
      return this.default(name, 'function')
    },
    resolvePathName(name, type) {
      return this.default(name, type)
    },
    resolveParamName(node, param) {
      return this.resolveName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveResponseName(node) {
      return this.resolveName(`${node.operationId} Response`)
    },
  }
})
