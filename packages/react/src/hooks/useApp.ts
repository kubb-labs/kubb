import type { FileManager, Plugin, PluginFactoryOptions, PluginManager } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'
import { useContext } from 'react'
import { App } from '../components/App'

type AppResult<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  plugin: Plugin<TOptions>
  mode: KubbFile.Mode
  pluginManager: PluginManager
  fileManager: FileManager
  getFile: PluginManager['getFile']
}

/**
 * `useApp` will return the current App with plugin, pluginManager, fileManager and mode.
 */
export function useApp<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(): AppResult<TOptions> {
  const app = useContext(App.Context)

  if (!app) {
    throw new Error('<App/> should be set')
  }

  return {
    plugin: app.plugin as Plugin<TOptions>,
    pluginManager: app.pluginManager,
    fileManager: app.pluginManager.fileManager,
    getFile: app.pluginManager.getFile.bind(app.pluginManager),
    mode: app.mode,
  }
}
