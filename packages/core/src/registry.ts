import type { Adapter, JSONPlugin, Parser, Plugin } from './types.ts'

type PluginFactory = (options?: object) => Plugin
type AdapterFactory = (options?: object) => Adapter

/**
 * Dynamically imports a package and returns its default export.
 *
 * Default exports are the stable contract — they work consistently
 * regardless of package naming conventions (`@kubb/plugin-ts`,
 * `kubb-plugin-valibot`, `my-custom-plugin`, etc.).
 *
 * Resolution order:
 * 1. `default` export
 * 2. First exported function (fallback for packages without a default export)
 */
export async function loadFactory<T>(packageName: string): Promise<T> {
  let mod: Record<string, unknown>
  try {
    mod = await import(packageName)
  } catch {
    throw new Error(`Package "${packageName}" could not be loaded. Make sure it is installed: \`npm install ${packageName}\``)
  }

  if (typeof mod['default'] === 'function') return mod['default'] as T

  const firstFn = Object.values(mod).find((v) => typeof v === 'function') as T | undefined
  if (firstFn) return firstFn

  throw new Error(`Package "${packageName}" does not export a default function or any callable export.`)
}

/**
 * Per-instance registry that maps string names to plugin/adapter/parser factories.
 *
 * In Node.js environments, unregistered names fall back to dynamic import
 * using the package name directly. In browser environments (where dynamic
 * import may not work), pre-register all plugins, adapters, and parsers
 * before resolution.
 */
export type PluginRegistry = {
  registerPlugin(name: string, factory: PluginFactory): void
  registerAdapter(name: string, factory: AdapterFactory): void
  registerParser(name: string, parser: Parser): void
  resolvePlugin(entry: JSONPlugin): Promise<Plugin>
  resolvePlugins(plugins: Array<JSONPlugin>): Promise<Array<Plugin>>
  resolveAdapter(name: string): Promise<Adapter>
  resolveParser(name: string): Promise<Parser>
}

/**
 * Creates a new isolated registry instance.
 * Each Kubb instance gets its own registry so registrations don't leak between builds.
 */
export function createRegistry(): PluginRegistry {
  const plugins = new Map<string, PluginFactory>()
  const adapters = new Map<string, AdapterFactory>()
  const parsers = new Map<string, Parser>()

  return {
    registerPlugin(name, factory) {
      plugins.set(name, factory)
    },
    registerAdapter(name, factory) {
      adapters.set(name, factory)
    },
    registerParser(name, parser) {
      parsers.set(name, parser)
    },
    async resolvePlugin(entry) {
      const registered = plugins.get(entry.name)
      if (registered) return registered(entry.options ?? {})

      const factory = await loadFactory<PluginFactory>(entry.name)
      return factory(entry.options ?? {})
    },
    async resolvePlugins(entries) {
      return Promise.all(entries.map((entry) => this.resolvePlugin(entry)))
    },
    async resolveAdapter(name) {
      const registered = adapters.get(name)
      if (registered) return registered()

      const factory = await loadFactory<AdapterFactory>(name)
      return factory()
    },
    async resolveParser(name) {
      const registered = parsers.get(name)
      if (registered) return registered

      let mod: Record<string, unknown>
      try {
        mod = await import(name)
      } catch {
        throw new Error(`Parser "${name}" could not be loaded. Make sure it is installed: \`npm install ${name}\``)
      }

      const parser = mod['default']

      if (!parser) {
        throw new Error(`Parser "${name}" does not have a default export.`)
      }

      return parser as Parser
    },
  }
}
