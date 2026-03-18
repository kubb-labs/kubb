import type { KubbFile } from '@kubb/fabric-core/types'
import { useFabric } from '@kubb/react-fabric'
import type { GetFileOptions, PluginDriver } from '../PluginDriver.ts'
import type { Config, Plugin, PluginFactoryOptions, ResolveNameParams, ResolvePathParams } from '../types.ts'

type ResolvePathOptions = {
  pluginName?: string
  group?: {
    tag?: string
    path?: string
  }
  type?: ResolveNameParams['type']
}

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
  getFile: (params: Omit<GetFileOptions<ResolvePathOptions>, 'pluginName'> & { pluginName?: string }) => KubbFile.File<{ pluginName: string }>
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
    pluginDriver: PluginDriver
  }>()

  const defaultPluginName = meta.plugin.name

  return {
    plugin: meta.plugin as Plugin<TOptions>,
    mode: meta.mode,
    config: meta.pluginDriver.config,
    getPluginByName: (pluginName = defaultPluginName) => meta.pluginDriver.getPluginByName.call(meta.pluginDriver, pluginName),
    getFile: ({ pluginName = defaultPluginName, ...rest }) => meta.pluginDriver.getFile.call(meta.pluginDriver, { pluginName, ...rest }),
    resolveName: ({ pluginName = defaultPluginName, ...rest }) => meta.pluginDriver.resolveName.call(meta.pluginDriver, { pluginName, ...rest }),
    resolvePath: ({ pluginName = defaultPluginName, ...rest }) => meta.pluginDriver.resolvePath.call(meta.pluginDriver, { pluginName, ...rest }),
  }
}
