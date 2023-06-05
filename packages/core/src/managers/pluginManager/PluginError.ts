import type { PluginManager } from './PluginManager'

export class PluginError extends Error {
  public pluginManager: PluginManager

  constructor(message: string, options: { cause?: Error; pluginManager: PluginManager }) {
    super(message, { cause: options.cause })

    this.pluginManager = options.pluginManager
  }
}
