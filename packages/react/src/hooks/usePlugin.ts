import { useApp } from './useApp.ts'

import type { KubbPlugin, PluginFactoryOptions } from '@kubb/core'

export function usePlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(): KubbPlugin<TOptions> {
  const app = useApp<{ plugin: KubbPlugin<TOptions> }>()

  return app.meta.plugin
}
