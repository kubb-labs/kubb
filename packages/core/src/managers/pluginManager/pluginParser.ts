import { getUniqueName } from '../../utils/getUniqueName.ts'

import type { CorePluginOptions } from '../../plugin.ts'
import type { KubbPlugin, KubbUserPlugin } from '../../types.ts'

const usedPluginNames: Record<string, number>= {}

export function pluginParser<TPlugin extends KubbUserPlugin>(plugin: TPlugin, context: CorePluginOptions['api'] | undefined): KubbPlugin | null {
  if (plugin.api && typeof plugin.api === 'function') {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const api = (plugin.api as Function).call(context) as typeof plugin.api

    return {
      ...plugin,
      key: [plugin.kind,...getUniqueName(plugin.name, usedPluginNames).split(plugin.name)] as [typeof plugin.kind, typeof plugin.name, string],
      api,
    }
  }

  return null
}
