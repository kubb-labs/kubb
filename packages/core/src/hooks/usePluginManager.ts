import { useApp } from '@kubb/react-fabric'
import type { PluginManager } from '../PluginManager.ts'

/**
 * @deprecated use useApp instead
 */
export function usePluginManager(): PluginManager {
  const { meta } = useApp<{ pluginManager: PluginManager }>()

  return meta.pluginManager
}
