import { useApp } from './useApp'

import type { AppMeta, FileManager } from '@kubb/core'

export function useFileManager(): FileManager {
  const app = useApp<AppMeta>()

  return app.meta.pluginManager.fileManager
}
