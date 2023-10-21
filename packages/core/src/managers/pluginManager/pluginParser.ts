import { setUniqueName } from '../../utils/uniqueName.ts'

import type { CorePluginOptions } from '../../plugin.ts'
import type { GetPluginFactoryOptions, KubbPlugin, KubbUserPlugin } from '../../types.ts'

const usedPluginNames: Record<string, number> = {}

export function pluginParser<TPlugin extends KubbUserPlugin>(
  plugin: TPlugin,
  context: CorePluginOptions['api'] | undefined,
): KubbPlugin<GetPluginFactoryOptions<TPlugin>> {
  setUniqueName(plugin.name, usedPluginNames)

  const key = plugin.key || [plugin.kind, plugin.name, usedPluginNames[plugin.name]].filter(Boolean) as [
    typeof plugin.kind,
    typeof plugin.name,
    string,
  ]

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
