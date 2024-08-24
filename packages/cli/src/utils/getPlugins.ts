import type { UserConfig } from '@kubb/core'

function isJSONPlugins(plugins: UserConfig['plugins']) {
  return !!(plugins as any)?.some((plugin: any) => {
    return Array.isArray(plugin) && typeof plugin?.at(0) === 'string'
  })
}

function isObjectPlugins(plugins: UserConfig['plugins']): plugins is any {
  return plugins instanceof Object && !Array.isArray(plugins)
}

export function getPlugins(plugins: UserConfig['plugins']): Promise<UserConfig['plugins']> {
  if (isObjectPlugins(plugins)) {
    throw new Error('Object plugins are not supported anymore, best to use http://kubb.dev/getting-started/configure#json')
  }

  if (isJSONPlugins(plugins)) {
    throw new Error('JSON plugins are not supported anymore, best to use http://kubb.dev/getting-started/configure#json')
  }

  return Promise.resolve(plugins)
}
