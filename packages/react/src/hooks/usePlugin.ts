import { useApp } from './useApp.ts'

import type { Plugin, PluginFactoryOptions } from '@kubb/core'

/**
 * `usePlugin` will return the current plugin.
 */
export function usePlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(): Plugin<TOptions> {
  const app = useApp<{ plugin: Plugin<TOptions> }>()

  return app.meta.plugin
}
