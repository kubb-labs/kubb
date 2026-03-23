import { useFabric } from '@kubb/react-fabric'
import type { PluginManager } from '../PluginManager.ts'

export function usePluginManager(): PluginManager {
  const { meta } = useFabric<{ pluginManager: PluginManager }>()

  return meta.pluginManager
}
