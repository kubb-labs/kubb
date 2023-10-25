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

export class SummaryError extends Error {
  public summary: string[]

  constructor(message: string, options: { cause: Error; summary?: string[] }) {
    super(message, { cause: options.cause })

    this.name = 'SummaryError'
    this.summary = options.summary || []
  }
}

/**
 * Behaves as an Error to log a warning in the console(still stops the execution)
 */
export class Warning extends Error {
  constructor(message?: string, options?: { cause: Error }) {
    super(message, { cause: options?.cause })

    this.name = 'Warning'
  }
}

export class ValidationPluginError extends Error {}
