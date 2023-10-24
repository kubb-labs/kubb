import { setUniqueName } from '../../utils/uniqueName.ts'

import type { CorePluginOptions } from '../../plugin.ts'
import type { GetPluginFactoryOptions, KubbPlugin, KubbUserPlugin } from '../../types.ts'
import type { PluginManager } from './PluginManager.ts'

export function pluginParser<TPlugin extends KubbUserPlugin>(
  plugin: TPlugin,
  pluginManager: PluginManager,
  context: CorePluginOptions['api'] | undefined,
): KubbPlugin<GetPluginFactoryOptions<TPlugin>> {
  const usedPluginNames = pluginManager.usedPluginNames

  setUniqueName(plugin.name, usedPluginNames)

  const key = plugin.key || ([plugin.kind, plugin.name, usedPluginNames[plugin.name]].filter(Boolean) as [typeof plugin.kind, typeof plugin.name, string])

  if (plugin.name !== 'core' && usedPluginNames[plugin.name]! >= 2) {
    pluginManager.logger.warn('Using multiple of the same plugin is an experimental feature')
  }

  // default transform
  if (!plugin.transform) {
    plugin.transform = function transform(code) {
      return code
    }
  }

  if (plugin.api && typeof plugin.api === 'function') {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const api = (plugin.api as Function).call(context) as typeof plugin.api

    return {
      ...plugin,
      key,
      api,
    } as unknown as KubbPlugin<GetPluginFactoryOptions<TPlugin>>
  }

  return {
    ...plugin,
    key,
  } as unknown as KubbPlugin<GetPluginFactoryOptions<TPlugin>>
}
