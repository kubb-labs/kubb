import type { KubbPlugin } from '../../types'

export class ValidationPluginError extends Error {}

export function validatePlugins(plugins: KubbPlugin[], dependedPluginNames: string | string[]): true {
  let pluginNames: string[] = []
  if (typeof dependedPluginNames === 'string') {
    pluginNames = [dependedPluginNames]
  } else {
    pluginNames = dependedPluginNames
  }

  pluginNames.forEach((pluginName) => {
    const exists = plugins.some((plugin) => plugin.name === pluginName)
    if (!exists) {
      throw new ValidationPluginError(`This plugin depends on the ${pluginName} plugin.`)
    }
  })

  return true
}
