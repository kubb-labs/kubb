/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { PackageManager } from '@kubb/core'

import type { KubbObjectPlugins, KubbUnionPlugins, KubbUserConfig } from '@kubb/core'

function isJSONPlugins(plugins: KubbUserConfig['plugins']): plugins is KubbUnionPlugins[] {
  return !!(plugins as KubbUnionPlugins[])?.some((plugin) => {
    return Array.isArray(plugin) && typeof plugin?.at(0) === 'string'
  })
}

function isObjectPlugins(plugins: KubbUserConfig['plugins']): plugins is KubbObjectPlugins {
  return plugins instanceof Object && !Array.isArray(plugins)
}

async function importPlugin(name: string, options: object): Promise<KubbUserConfig['plugins']> {
  const packageManager = new PackageManager(process.cwd())

  const importedPlugin: any = process.env.NODE_ENV === 'test' ? await import(name) : await packageManager.import(name)

  // eslint-disable-next-line
  return importedPlugin?.default ? importedPlugin.default(options) : importedPlugin(options)
}

export function getPlugins(plugins: KubbUserConfig['plugins']): Promise<KubbUserConfig['plugins']> {
  if (isObjectPlugins(plugins)) {
    const promises = Object.keys(plugins).map((name) => {
      return importPlugin(name, Reflect.get(plugins, name) as object)
    })
    return Promise.all(promises) as Promise<KubbUserConfig['plugins']>
  }

  if (isJSONPlugins(plugins)) {
    const promises = plugins.map((plugin) => {
      const [name, options = {}] = plugin
      return importPlugin(name, options as object)
    })
    return Promise.all(promises) as Promise<KubbUserConfig['plugins']>
  }

  return Promise.resolve(plugins)
}
