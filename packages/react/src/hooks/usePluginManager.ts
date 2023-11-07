import { useApp } from './useApp.ts'

import type { PluginManager } from '@kubb/core'

export function usePluginManager(): PluginManager {
  const app = useApp<{ pluginManager: PluginManager }>()

  return app.meta.pluginManager
}
