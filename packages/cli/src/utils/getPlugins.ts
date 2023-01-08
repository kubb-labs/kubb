import type { KubbUserConfig, KubbJSONPlugin } from '@kubb/core'

const isJSONPlugins = (plugins: KubbUserConfig['plugins'] | KubbJSONPlugin[]): plugins is KubbJSONPlugin[] => {
  return !!plugins?.some((plugin) => {
    return typeof plugin?.[0] === 'string'
  })
}

export const getPlugins = (plugins: KubbUserConfig['plugins'] | KubbJSONPlugin[]): Promise<KubbUserConfig['plugins']> => {
  if (isJSONPlugins(plugins)) {
    const promises = plugins.map(async (plugin) => {
      const [name, options = {}] = plugin
      const importedPlugin = await import(name)
      return importedPlugin?.default ? importedPlugin.default(options) : importedPlugin(options)
    })
    return Promise.all(promises)
  }
  return Promise.resolve(plugins)
}
