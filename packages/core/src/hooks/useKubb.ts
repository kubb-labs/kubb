import type { KubbFile } from '@kubb/fabric-core/types'
import { useApp as useAppBase } from '@kubb/react-fabric'
import type { PluginManager } from '../PluginManager.ts'
import type { Plugin, PluginFactoryOptions } from '../types.ts'

export function useKubb<TOptions extends PluginFactoryOptions = PluginFactoryOptions>() {
  const { meta } = useAppBase<{
    plugin: Plugin<TOptions>
    mode: KubbFile.Mode
    pluginManager: PluginManager
  }>()

  return {
    plugin: meta.plugin as Plugin<TOptions>,
    mode: meta.mode,
    config: meta.pluginManager.config,
    getPluginByName: meta.pluginManager.getPluginByName.bind(meta.pluginManager),
    getFile: meta.pluginManager.getFile.bind(meta.pluginManager),
    resolveName: meta.pluginManager.resolveName.bind(meta.pluginManager),
    resolvePath: meta.pluginManager.resolvePath.bind(meta.pluginManager),
  }
}
