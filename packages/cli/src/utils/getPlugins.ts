// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ModuleImporter } from '@humanwhocodes/module-importer'
import isObject from 'lodash.isobject'
// see https://github.com/eslint/eslint/blob/740b20826fadc5322ea5547c1ba41793944e571d/lib/cli.js

import type { KubbUserConfig, KubbJSONPlugin, KubbObjectPlugin } from '@kubb/core'

function isJSONPlugins(plugins: KubbUserConfig['plugins'] | KubbJSONPlugin[]): plugins is KubbJSONPlugin[] {
  return !!(plugins as KubbJSONPlugin[])?.some((plugin) => {
    return typeof plugin?.[0] === 'string'
  })
}

function isObjectPlugins(plugins: KubbUserConfig['plugins'] | KubbJSONPlugin[]): plugins is KubbObjectPlugin {
  return isObject(plugins) && !Array.isArray(plugins)
}

async function importPlugin(name: string, options: object) {
  const importer = new ModuleImporter(process.cwd())

  const importedPlugin = process.env.NODE_ENV === 'test' ? await import(name) : await importer.import(name)

  return importedPlugin?.default?.default ? importedPlugin.default.default(options) : importedPlugin.default(options)
}

export function getPlugins(plugins: KubbUserConfig['plugins'] | KubbJSONPlugin[]): Promise<KubbUserConfig['plugins']> {
  if (isObjectPlugins(plugins)) {
    const promises = Object.keys(plugins).map(async (name) => {
      return importPlugin(name, plugins[name as keyof typeof plugins])
    })
    return Promise.all(promises)
  }

  if (isJSONPlugins(plugins)) {
    const promises = plugins.map(async (plugin) => {
      const [name, options = {}] = plugin
      return importPlugin(name, options)
    })
    return Promise.all(promises)
  }
  return Promise.resolve(plugins)
}
