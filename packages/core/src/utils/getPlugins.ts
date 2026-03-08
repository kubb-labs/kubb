import type { UnknownUserPlugin, UserConfig } from '../types.ts'

type PluginsArray = Array<Omit<UnknownUserPlugin, 'inject'>>

function isJSONPlugins(plugins: UserConfig['plugins']): boolean {
  return Array.isArray(plugins) && plugins.some((plugin) => Array.isArray(plugin) && typeof (plugin as unknown[])[0] === 'string')
}

function isObjectPlugins(plugins: UserConfig['plugins']): boolean {
  return plugins instanceof Object && !Array.isArray(plugins)
}

export function getPlugins(plugins: UserConfig['plugins']): Promise<PluginsArray | undefined> {
  if (isObjectPlugins(plugins)) {
    throw new Error('Object plugins are not supported anymore, best to use http://kubb.dev/getting-started/configure#json')
  }

  if (isJSONPlugins(plugins)) {
    throw new Error('JSON plugins are not supported anymore, best to use http://kubb.dev/getting-started/configure#json')
  }

  return Promise.resolve(plugins)
}
