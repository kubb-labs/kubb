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
