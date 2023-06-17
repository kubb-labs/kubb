import type { PluginError } from './PluginError.ts'
import type { PluginManager } from './PluginManager'

export class ParallelPluginError extends Error {
  public errors: PluginError[] = []

  public pluginManager: PluginManager

  constructor(message: string, options: { cause?: Error; errors: PluginError[]; pluginManager: PluginManager }) {
    super(message, { cause: options.cause })

    this.name = 'ParallelPluginError'
    this.errors = options.errors
    this.pluginManager = options.pluginManager
  }

  findError<T extends Error = Error>(searchError: T | undefined): T | undefined {
    if (!searchError) {
      return undefined
    }

    return this.errors.find((error) => {
      if (error.cause) {
        if (error.cause.name == searchError.name) {
          return true
        }

        return !!this.findError(error.cause)
      }
      return error.name === searchError.name
    })?.cause as T
  }
}
