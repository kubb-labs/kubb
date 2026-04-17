import type { PluginRegistry } from './registry.ts'
import type { Config, JSONConfig } from './types.ts'

/**
 * Converts a JSON-serializable config into a runtime `Config`.
 *
 * Resolves string references for adapters, parsers, and plugins
 * using the provided registry instance.
 */
export async function resolveJSONConfig(registry: PluginRegistry, json: JSONConfig): Promise<Config> {
  const adapter = await registry.resolveAdapter(json.adapter ?? 'oas')

  const parsers = json.parsers
    ? await Promise.all(json.parsers.map((p) => registry.resolveParser(p)))
    : await Promise.all(['ts', 'tsx'].map((p) => registry.resolveParser(p)))

  const plugins = json.plugins ? await registry.resolvePlugins(json.plugins) : []

  return {
    name: json.name,
    root: json.root ?? '.',
    input: json.input,
    output: {
      path: json.output.path,
      clean: json.output.clean,
      write: json.output.write,
      format: json.output.format,
      lint: json.output.lint,
      extension: json.output.extension ? (json.output.extension as Config['output']['extension']) : undefined,
      barrelType: json.output.barrelType,
      defaultBanner: json.output.defaultBanner,
      override: json.output.override,
    },
    adapter,
    parsers,
    plugins,
    hooks: json.hooks,
    devtools: json.devtools === false ? undefined : json.devtools,
  }
}
