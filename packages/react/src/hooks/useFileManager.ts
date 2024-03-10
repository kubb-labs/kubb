import { useApp } from './useApp.ts'

import type { FileManager, PluginManager } from '@kubb/core'

/**
 * `useFileManager` will return the current FileManager instance.
 */
export function useFileManager(): FileManager {
  const app = useApp<{ pluginManager: PluginManager }>()

  return app.meta.pluginManager.fileManager
}
