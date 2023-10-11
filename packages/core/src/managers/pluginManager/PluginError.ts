import type { PluginManager } from './PluginManager.ts'

export class PluginError extends Error {
  public pluginManager: PluginManager
  public cause: Error

  constructor(message: string, options: { cause: Error; pluginManager: PluginManager }) {
    super(message, { cause: options.cause })

    this.name = 'PluginError'
    this.cause = options.cause
    this.pluginManager = options.pluginManager
  }
}
