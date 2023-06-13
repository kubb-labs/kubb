import type { PluginError } from './PluginError.ts'
import type { PluginManager } from './PluginManager'

export class ParallelPluginError extends Error {
  public errors: PluginError[]

  public pluginManager: PluginManager

  constructor(message: string, options: { cause?: Error; errors: PluginError[]; pluginManager: PluginManager }) {
    super(message, { cause: options.cause })

    this.name = 'ParallelPluginError'
    this.errors = options.errors
    this.pluginManager = options.pluginManager
  }
}
