import type { KubbFile } from '@kubb/fabric-core/types'
import { useFabric } from '@kubb/react-fabric'
import type { GetFileOptions, PluginManager } from '../PluginManager.ts'
import type { Config, Plugin, PluginFactoryOptions, ResolveNameParams, ResolvePathParams } from '../types.ts'

type UseKubbReturn<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  plugin: Plugin<TOptions>
  mode: KubbFile.Mode
  config: Config
  /**
   * Returns the plugin whose `name` matches `pluginName`, defaulting to the current plugin.
   */
  getPluginByName: (pluginName?: string) => Plugin | undefined
  /**
   * Resolves a file reference, defaulting `pluginName` to the current plugin.
   */
  getFile: <TFileOptions = object>(params: Omit<GetFileOptions<TFileOptions>, 'pluginName'> & { pluginName?: string }) => KubbFile.File<{ pluginName: string }>
  /**
   * Resolves a name, defaulting `pluginName` to the current plugin.
   */
  resolveName: (params: Omit<ResolveNameParams, 'pluginName'> & { pluginName?: string }) => string
  /**
   * Resolves a path, defaulting `pluginName` to the current plugin.
   */
  resolvePath: <TPathOptions = object>(params: Omit<ResolvePathParams<TPathOptions>, 'pluginName'> & { pluginName?: string }) => KubbFile.Path
}

export function useKubb<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(): UseKubbReturn<TOptions> {
  const { meta } = useFabric<{
    plugin: Plugin<TOptions>
    mode: KubbFile.Mode
    pluginManager: PluginManager
  }>()

  const defaultPluginName = meta.plugin.name

  return {
    plugin: meta.plugin as Plugin<TOptions>,
    mode: meta.mode,
    config: meta.pluginManager.config,
    getPluginByName: (pluginName = defaultPluginName) => meta.pluginManager.getPluginByName.call(meta.pluginManager, pluginName),
    getFile: ({ pluginName = defaultPluginName, ...rest }) => meta.pluginManager.getFile.call(meta.pluginManager, { pluginName, ...rest }),
    resolveName: ({ pluginName = defaultPluginName, ...rest }) => meta.pluginManager.resolveName.call(meta.pluginManager, { pluginName, ...rest }),
    resolvePath: ({ pluginName = defaultPluginName, ...rest }) => meta.pluginManager.resolvePath.call(meta.pluginManager, { pluginName, ...rest }),
  }
}
