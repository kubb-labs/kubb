import type { FileManager, Plugin, PluginFactoryOptions, PluginManager } from '@kubb/core'
import type { KubbFile } from '@kubb/core/fs'
import { useContext } from 'react'
import { App } from '../components/App'

type AppResult<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Exit (unmount)
   */
  readonly exit: (error?: Error) => void
  readonly plugin: Plugin<TOptions>
  readonly mode: KubbFile.Mode
  readonly pluginManager: PluginManager
  readonly fileManager: FileManager
  readonly getFile: PluginManager['getFile']
}

/**
 * `useApp` will return the current App with plugin, pluginManager, fileManager and mode.
 */
export function useApp<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(): AppResult<TOptions> {
  const app = useContext(App.Context)

  if (!app) {
    throw new Error('<App /> should be set')
  }

  return {
    plugin: app.plugin as Plugin<TOptions>,
    pluginManager: app.pluginManager,
    fileManager: app.pluginManager.fileManager,
    getFile: app.pluginManager.getFile.bind(app.pluginManager),
    mode: app.mode,
    exit: app.exit,
  }
}
