import type { KubbPlugin } from '../../types.ts'

export class ValidationPluginError extends Error {}

export function getDependedPlugins<TPlugins extends KubbPlugin[]>(plugins: KubbPlugin[], dependedPluginNames: string | string[]): TPlugins {
  let pluginNames: string[] = []
  if (typeof dependedPluginNames === 'string') {
    pluginNames = [dependedPluginNames]
  } else {
    pluginNames = dependedPluginNames
  }

  return pluginNames.map((pluginName) => {
    const plugin = plugins.find((plugin) => plugin.name === pluginName)
    if (!plugin) {
      throw new ValidationPluginError(`This plugin depends on the ${pluginName} plugin.`)
    }
    return plugin
  }) as TPlugins
}
