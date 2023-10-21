import { getUniqueName } from '../../utils/getUniqueName.ts'

import type { CorePluginOptions } from '../../plugin.ts'
import type { KubbPlugin, KubbUserPlugin } from '../../types.ts'

const usedPluginNames: Record<string, number> = {}

export function pluginParser<TPlugin extends KubbUserPlugin>(plugin: TPlugin, context: CorePluginOptions['api'] | undefined): KubbPlugin {
  const key = [plugin.kind, plugin.name, getUniqueName(plugin.name, usedPluginNames).split(plugin.name).at(1)] as [
    typeof plugin.kind,
    typeof plugin.name,
    string,
  ]

  if (plugin.api && typeof plugin.api === 'function') {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const api = (plugin.api as Function).call(context) as typeof plugin.api

    return {
      ...plugin,
      key,
      api,
    }
  }

  return {
    ...plugin,
    key,
  } as KubbPlugin
}
