import { useApp } from '@kubb/react-fabric'
import type { PluginManager } from '../PluginManager.ts'

export function usePluginManager(): Pick<PluginManager, 'resolvePath' | 'resolveName' | 'getFile' | 'config'> {
  const { meta } = useApp<{ pluginManager: PluginManager }>()

  return {
    config: meta.pluginManager.config,
    getFile: meta.pluginManager.getFile.bind(meta.pluginManager),
    resolveName: meta.pluginManager.resolveName.bind(meta.pluginManager),
    resolvePath: meta.pluginManager.resolvePath.bind(meta.pluginManager),
  }
}
