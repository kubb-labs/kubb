import { useApp } from './useApp.ts'

import type { AppMeta, KubbPlugin, PluginFactoryOptions } from '@kubb/core'

export function usePlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(): KubbPlugin<TOptions> {
  const app = useApp<AppMeta & { plugin: KubbPlugin<TOptions> }>()

  return app.meta.plugin
}
