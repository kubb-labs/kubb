import { useApp } from '@kubb/react-fabric'
import type { PluginManager } from '../PluginManager.ts'

export function usePluginManager(): PluginManager {
  const { meta } = useApp<{ pluginManager: PluginManager }>()

  return meta.pluginManager
}
