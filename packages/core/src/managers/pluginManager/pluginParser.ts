import type { CorePluginOptions } from '../../plugin.ts'
import type { KubbPlugin, KubbUserPlugin } from '../../types.ts'

export function pluginParser(plugin: KubbUserPlugin, context: CorePluginOptions['api'] | undefined): KubbPlugin | null {
  if (plugin.api && typeof plugin.api === 'function') {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const api = (plugin.api as Function).call(context) as typeof plugin.api

    return {
      ...plugin,
      api,
    }
  }

  return null
}
