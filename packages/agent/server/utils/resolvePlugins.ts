import type { Plugin, UserPlugin } from '@kubb/core'
import type { JSONKubbConfig } from '~/types/agent.ts'

/**
 * Derives the exported factory function name from a plugin package name.
 * e.g. `@kubb/plugin-react-query` → `pluginReactQuery`
 */
export function getFactoryName(packageName: string): string {
  const match = packageName.match(/\/plugin-(.+)$/)
  if (!match) {
    return packageName
  }
  return `plugin-${match[1]}`.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

/**
 * Dynamically imports each plugin package and calls its factory function with
 * the provided options, returning an array of resolved {@link UserPlugin} instances.
 *
 * @example
 * // JSONKubbConfig plugin entry
 * { name: '@kubb/plugin-react-query', options: { output: { path: './hooks' } } }
 * // is resolved by importing `@kubb/plugin-react-query` and calling
 * // `pluginReactQuery({ output: { path: './hooks' } })`
 */
export async function resolvePlugins(plugins: NonNullable<JSONKubbConfig['plugins']>): Promise<Array<Plugin>> {
  return Promise.all(
    plugins.map(async ({ name, options }) => {
      const mod = await import(name)
      const factoryName = getFactoryName(name)
      const factory = mod[factoryName]

      if (typeof factory !== 'function') {
        throw new Error(`Plugin factory "${factoryName}" not found in package "${name}"`)
      }

      return factory(options ?? {}) as Plugin
    }),
  )
}
