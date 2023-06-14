// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { importModule } from '@kubb/core'

import type { KubbJSONPlugins, KubbObjectPlugin, KubbUserConfig } from '@kubb/core'

function isJSONPlugins(plugins: KubbUserConfig['plugins'] | KubbJSONPlugins[]): plugins is KubbJSONPlugins[] {
  return !!(plugins as KubbJSONPlugins[])?.some((plugin) => {
    return typeof plugin?.[0] === 'string'
  })
}

function isObjectPlugins(plugins: KubbUserConfig['plugins'] | KubbJSONPlugins[]): plugins is KubbObjectPlugin {
  return plugins instanceof Object && !Array.isArray(plugins)
}

async function importPlugin(name: string, options: object): Promise<KubbUserConfig['plugins']> {
  const importedPlugin: any = process.env.NODE_ENV === 'test' ? await import(name) : await importModule(name, process.cwd())

  // eslint-disable-next-line
  return importedPlugin?.default ? importedPlugin.default(options) : importedPlugin(options)
}

export function getPlugins(plugins: KubbUserConfig['plugins'] | KubbJSONPlugins[] | KubbObjectPlugin[]): Promise<KubbUserConfig['plugins']> {
  if (isObjectPlugins(plugins)) {
    const promises = Object.keys(plugins).map((name) => {
      return importPlugin(name, plugins[name as keyof typeof plugins])
    })
    return Promise.all(promises)
  }

  if (isJSONPlugins(plugins)) {
    const promises = plugins.map((plugin) => {
      const [name, options = {}] = plugin
      return importPlugin(name, options)
    })
    return Promise.all(promises)
  }

  return Promise.resolve(plugins)
}
